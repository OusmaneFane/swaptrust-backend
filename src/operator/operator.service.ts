import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

const HOURS_24 = 24 * 60 * 60 * 1000;

@Injectable()
export class OperatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly requestsService: RequestsService,
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

    const amountCfa =
      request.type === RequestType.NEED_RUB ? request.amountToSend : request.amountWanted;
    const amountRub =
      request.type === RequestType.NEED_RUB ? request.amountWanted : request.amountToSend;

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
      title: 'Votre demande est prise en charge',
      body: `Envoyez vos fonds sur : ${dto.operatorPaymentNumber}`,
      data: { transactionId: transaction.id, requestId: request.id },
    });

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
        client: { select: { id: true, name: true, phoneMali: true, phoneRussia: true } },
        operatorLogs: { orderBy: { createdAt: 'desc' } },
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
        operatorLogs: { orderBy: { createdAt: 'asc' } },
        messages: { orderBy: { createdAt: 'asc' } },
        dispute: true,
      },
    });
    if (!t) throw new NotFoundException();
    this.assertAssignedOperator(t.operatorId, userId, role);
    return t;
  }

  async verifyClientProof(transactionId: number, operatorId: number, role: UserRole) {
    const t = await this.prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
    this.assertAssignedOperator(t.operatorId, operatorId, role);
    if (t.status !== TransactionStatus.CLIENT_SENT) {
      throw new BadRequestException('Le reçu client doit être uploadé avant vérification');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.OPERATOR_VERIFIED },
      });
      await tx.operatorLog.create({
        data: { transactionId, operatorId, action: 'CLIENT_PROOF_VIEWED' },
      });
    });

    return this.getTransactionDetail(transactionId, operatorId, role);
  }

  async confirmOperatorSend(
    transactionId: number,
    operatorId: number,
    role: UserRole,
    proofUrl: string,
  ) {
    const t = await this.prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
    this.assertAssignedOperator(t.operatorId, operatorId, role);
    if (
      t.status !== TransactionStatus.OPERATOR_VERIFIED &&
      t.status !== TransactionStatus.CLIENT_SENT
    ) {
      throw new BadRequestException('État de transaction invalide pour l’envoi opérateur');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.OPERATOR_SENT,
          operatorProofUrl: proofUrl,
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
      include: { request: true },
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

    return { cancelled: true };
  }
}
