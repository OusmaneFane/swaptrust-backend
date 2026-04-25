import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  RequestStatus,
  RequestType,
  TransactionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestsService } from '../requests/requests.service';
import { FilterRequestsDto } from '../requests/dto/filter-requests.dto';
import { FilterTransactionsDto } from '../transactions/dto/filter-transactions.dto';
import { TakeRequestDto } from './dto/take-request.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { clientWhatsappPhone } from '../common/utils/client-whatsapp-phone';
import { formatCFA, formatRUB } from '../common/utils/format-money';
import { CommissionsService } from '../commissions/commissions.service';

const HOURS_24 = 24 * 60 * 60 * 1000;

@Injectable()
export class OperatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly requestsService: RequestsService,
    private readonly config: ConfigService,
    private readonly whatsapp: WhatsappService,
    private readonly commissions: CommissionsService,
  ) {}

  listPendingRequests(filters: FilterRequestsDto) {
    return this.requestsService.listPendingForOperator(filters);
  }

  async getRequestDetail(id: number) {
    const r = await this.prisma.exchangeRequest.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneMali: true,
            phoneRussia: true,
            kycStatus: true,
            ratingAvg: true,
          },
        },
        transaction: true,
      },
    });
    if (!r) throw new NotFoundException();
    return r;
  }

  async takeRequest(requestId: number, operator: Express.User, dto: TakeRequestDto) {
    if (operator.role !== UserRole.OPERATOR && operator.role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }

    const request = await this.prisma.exchangeRequest.findFirst({
      where: {
        id: requestId,
        status: RequestStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: { client: true, transaction: true },
    });
    if (!request || request.transaction) {
      throw new BadRequestException('Demande introuvable, expirée ou déjà prise en charge');
    }

    const platformAccount = await this.prisma.platformAccount.findFirst({
      where: { method: request.paymentMethod, isActive: true },
      orderBy: { id: 'asc' },
    });
    if (!platformAccount) {
      throw new BadRequestException(
        'Aucun compte DoniSend actif pour cette méthode de paiement. Contactez l’administrateur.',
      );
    }

    const amountCfa =
      request.type === RequestType.NEED_RUB ? request.amountToSend : request.amountWanted;
    const amountRub =
      request.type === RequestType.NEED_RUB ? request.amountWanted : request.amountToSend;

    const commissionPct = this.commissions.getCommissionBasePercent();
    const grossAmount = request.amountToSend;
    const netAmount = grossAmount - request.commissionAmount;

    const transaction = await this.prisma.$transaction(async (tx) => {
      const t = await tx.transaction.create({
        data: {
          requestId: request.id,
          clientId: request.clientId,
          operatorId: operator.id,
          amountCfa,
          amountRub,
          rate: request.rateAtRequest,
          commissionAmount: request.commissionAmount,
          grossAmount,
          netAmount,
          commissionPercent: new Prisma.Decimal(commissionPct.toFixed(2)),
          googleRate: request.rateAtRequest,
          platformAccountId: platformAccount.id,
          status: TransactionStatus.INITIATED,
          operatorPaymentNumber: dto.operatorPaymentNumber,
          clientReceiveNumber: request.phoneToSend,
          operatorNote: dto.operatorNote,
          takenAt: new Date(),
          expiresAt: new Date(Date.now() + HOURS_24),
        },
      });

      await tx.exchangeRequest.update({
        where: { id: requestId },
        data: { status: RequestStatus.IN_PROGRESS },
      });

      await tx.operatorLog.create({
        data: {
          transactionId: t.id,
          operatorId: operator.id,
          action: 'TAKEN',
          note: `Prise en charge par ${operator.name ?? 'opérateur'}`,
        },
      });

      return t;
    });

    await this.notifications.notify(request.clientId, {
      type: 'REQUEST_TAKEN',
      title: 'Votre demande est prise en charge !',
      body: `Envoyez le montant exact sur le numéro DoniSend ${platformAccount.accountName} — ne payez pas directement l’opérateur.`,
      data: {
        transactionId: transaction.id,
        requestId: request.id,
        platformAccountNumber: platformAccount.accountNumber,
        platformAccountName: platformAccount.accountName,
        exactAmount: grossAmount.toString(),
      },
    });

    const exactStr =
      request.type === RequestType.NEED_RUB
        ? formatCFA(Number(grossAmount))
        : formatRUB(Number(grossAmount));
    void this.whatsapp
      .sendRequestTaken({
        user: {
          name: request.client.name,
          phone: clientWhatsappPhone(request.client),
        },
        transactionId: transaction.id,
        platformAccountNumber: platformAccount.accountNumber,
        platformAccountName: platformAccount.accountName,
        exactAmount: exactStr,
        operatorName: operator.name ?? 'Opérateur',
      })
      .catch(() => {});

    return transaction;
  }

  private assertAssignedOperator(
    transactionOperatorId: number,
    operatorId: number,
    role: UserRole,
  ) {
    if (role === UserRole.ADMIN) return;
    if (transactionOperatorId !== operatorId) {
      throw new ForbiddenException('Cette transaction est gérée par un autre opérateur');
    }
  }

  async getOperatorTransactions(operatorId: number, filters: FilterTransactionsDto) {
    const where: Prisma.TransactionWhereInput = { operatorId };
    if (filters.status) where.status = filters.status;
    const since =
      filters.period === '7d'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : filters.period === '30d'
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          : undefined;
    if (since) where.createdAt = { gte: since };

    return this.prisma.transaction.findMany({
      where,
      include: {
        request: true,
        platformAccount: true,
        client: { select: { id: true, name: true, phoneMali: true, phoneRussia: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionDetail(id: number, userId: number, role: UserRole) {
    const t = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        request: true,
        client: {
          select: {
            id: true,
            name: true,
            phoneMali: true,
            phoneRussia: true,
            ratingAvg: true,
          },
        },
        operator: { select: { id: true, name: true, role: true } },
        platformAccount: true,
        messages: { orderBy: { createdAt: 'asc' } },
        dispute: true,
      },
    });
    if (!t) throw new NotFoundException();
    this.assertAssignedOperator(t.operatorId, userId, role);
    return t;
  }

  /**
   * Étape 2 — L’opérateur confirme avoir reçu le virement net depuis DoniSend (preuve interne).
   */
  async confirmPlatformTransfer(
    transactionId: number,
    operatorId: number,
    role: UserRole,
    proofUrl: string | null,
  ) {
    const t = await this.prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
    this.assertAssignedOperator(t.operatorId, operatorId, role);
    if (t.status !== TransactionStatus.CLIENT_SENT) {
      throw new BadRequestException(
        'Le client doit d’abord confirmer l’envoi vers le compte DoniSend',
      );
    }
    if (t.platformTransferredAt) {
      throw new BadRequestException('Ce transfert plateforme → opérateur est déjà enregistré');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          platformToOperatorProofUrl: proofUrl ?? undefined,
          platformTransferredAt: new Date(),
          status: TransactionStatus.OPERATOR_VERIFIED,
        },
      });
      await tx.operatorLog.create({
        data: { transactionId, operatorId, action: 'PLATFORM_TO_OPERATOR_CONFIRMED' },
      });
    });

    await this.notifications.notify(t.clientId, {
      type: 'PLATFORM_TO_OPERATOR_DONE',
      title: 'Votre échange avance',
      body: 'DoniSend a reversé le montant net à l’opérateur. Vous recevrez vos roubles sous peu.',
      data: { transactionId },
    });

    return this.getTransactionDetail(transactionId, operatorId, role);
  }

  async confirmOperatorSend(
    transactionId: number,
    operatorId: number,
    role: UserRole,
    proofUrl: string | null,
  ) {
    const t = await this.prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: {
        client: { select: { name: true, phoneMali: true, phoneRussia: true } },
        request: { select: { type: true } },
      },
    });
    this.assertAssignedOperator(t.operatorId, operatorId, role);
    if (t.status !== TransactionStatus.OPERATOR_VERIFIED) {
      throw new BadRequestException(
        'L’opérateur doit d’abord confirmer la réception du virement DoniSend (étape intermédiaire)',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.OPERATOR_SENT,
          operatorProofUrl: proofUrl ?? undefined,
          operatorSentAt: new Date(),
        },
      });
      await tx.operatorLog.create({
        data: { transactionId, operatorId, action: 'OPERATOR_SENT' },
      });
    });

    await this.notifications.notify(t.clientId, {
      type: 'OPERATOR_SENT',
      title: 'Fonds envoyés',
      body: 'L’opérateur a envoyé vos fonds. Vérifiez votre compte et confirmez la réception.',
      data: { transactionId },
    });

    const amountSentLabel =
      t.request.type === RequestType.NEED_RUB
        ? formatRUB(Number(t.amountRub))
        : formatCFA(Number(t.amountCfa));
    void this.whatsapp
      .sendOperatorSentFunds({
        user: {
          name: t.client.name,
          phone: clientWhatsappPhone(t.client),
        },
        transactionId,
        amountSent: amountSentLabel,
        receiveNumber: t.clientReceiveNumber ?? '—',
      })
      .catch(() => {});

    return this.getTransactionDetail(transactionId, operatorId, role);
  }

  /**
   * Upload / mise à jour du reçu d'envoi opérateur (preuve) après coup.
   * Utile si le frontend a validé "send" sans multipart ou si l'opérateur veut ajouter un PDF plus tard.
   */
  async uploadOperatorProof(
    transactionId: number,
    operatorId: number,
    role: UserRole,
    proofUrl: string,
  ) {
    const t = await this.prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      select: { id: true, operatorId: true, status: true },
    });
    this.assertAssignedOperator(t.operatorId, operatorId, role);
    if (
      t.status !== TransactionStatus.OPERATOR_VERIFIED &&
      t.status !== TransactionStatus.OPERATOR_SENT &&
      t.status !== TransactionStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Preuve opérateur non autorisée à ce stade (attendu: OPERATOR_VERIFIED/OPERATOR_SENT/COMPLETED)',
      );
    }
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { operatorProofUrl: proofUrl },
    });
    await this.prisma.operatorLog.create({
      data: { transactionId, operatorId, action: 'OPERATOR_PROOF_UPLOADED' },
    });
    return this.getTransactionDetail(transactionId, operatorId, role);
  }

  /**
   * Upload / mise à jour du reçu interne "plateforme → opérateur" après coup.
   */
  async uploadPlatformTransferProof(
    transactionId: number,
    operatorId: number,
    role: UserRole,
    proofUrl: string,
  ) {
    const t = await this.prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      select: { id: true, operatorId: true, status: true, platformTransferredAt: true },
    });
    this.assertAssignedOperator(t.operatorId, operatorId, role);
    if (!t.platformTransferredAt) {
      throw new BadRequestException(
        'Transfert plateforme → opérateur non confirmé (uploader la preuve après la confirmation)',
      );
    }
    if (
      t.status !== TransactionStatus.OPERATOR_VERIFIED &&
      t.status !== TransactionStatus.OPERATOR_SENT &&
      t.status !== TransactionStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Preuve plateforme → opérateur non autorisée à ce stade',
      );
    }
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { platformToOperatorProofUrl: proofUrl },
    });
    await this.prisma.operatorLog.create({
      data: { transactionId, operatorId, action: 'PLATFORM_TO_OPERATOR_PROOF_UPLOADED' },
    });
    return this.getTransactionDetail(transactionId, operatorId, role);
  }

  async addNote(transactionId: number, operatorId: number, note: string, role: UserRole) {
    const t = await this.prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
    this.assertAssignedOperator(t.operatorId, operatorId, role);

    await this.prisma.operatorLog.create({
      data: { transactionId, operatorId, action: 'NOTE', note },
    });
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: { operatorNote: note },
    });
  }

  async cancelTransaction(
    transactionId: number,
    operatorId: number,
    role: UserRole,
    reason: string,
  ) {
    const t = await this.prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: {
        request: true,
        client: { select: { name: true, phoneMali: true, phoneRussia: true } },
      },
    });
    this.assertAssignedOperator(t.operatorId, operatorId, role);
    if (
      t.status === TransactionStatus.COMPLETED ||
      t.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException('Transaction déjà terminée ou annulée');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.CANCELLED },
      });
      await tx.exchangeRequest.update({
        where: { id: t.requestId },
        data: { status: RequestStatus.CANCELLED },
      });
      await tx.operatorLog.create({
        data: {
          transactionId,
          operatorId,
          action: 'CANCELLED',
          note: reason,
        },
      });
    });

    await this.notifications.notify(t.clientId, {
      type: 'TRANSACTION_CANCELLED',
      title: 'Transaction annulée',
      body: reason,
      data: { transactionId },
    });

    void this.whatsapp
      .sendTransactionCancelled({
        user: {
          name: t.client.name,
          phone: clientWhatsappPhone(t.client),
        },
        transactionId,
        reason,
      })
      .catch(() => {});

    return { cancelled: true };
  }
}
