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
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { CreateDisputeDto } from '../disputes/dto/create-dispute.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { clientWhatsappPhone } from '../common/utils/client-whatsapp-phone';
import { formatCFA, formatRUB } from '../common/utils/format-money';
import { CommissionsService } from '../commissions/commissions.service';
import { ReceiptsService } from '../receipts/receipts.service';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly whatsapp: WhatsappService,
    private readonly commissions: CommissionsService,
    private readonly receipts: ReceiptsService,
  ) {}

  private proofViewUrl(rel?: string | null): string | null {
    if (!rel) return null;
    // stored as "proofs/<filename>"
    const parts = rel.split('/');
    const filename = parts.length === 2 && parts[0] === 'proofs' ? parts[1] : '';
    if (!filename) return null;
    return `/api/v1/proofs/${encodeURIComponent(filename)}`;
  }

  private periodStart(period?: string) {
    if (period === '7d') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (period === '30d')
      return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return undefined;
  }

  async listForClient(clientId: number, q: FilterTransactionsDto) {
    const since = this.periodStart(q.period);
    const where: Prisma.TransactionWhereInput = { clientId };
    if (since) where.createdAt = { gte: since };
    if (q.status) where.status = q.status;

    const rows = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        request: true,
        platformAccount: true,
        // Privacy: do not expose operator identity to clients
        operator: { select: { id: true, avatar: true } },
      },
    });
    return rows.map(({ operatorPaymentNumber: _op, ...r }) => ({
      ...r,
      operatorPaymentNumber: null,
      clientProofViewUrl: this.proofViewUrl(r.clientProofUrl),
      operatorProofViewUrl: this.proofViewUrl(r.operatorProofUrl),
      platformToOperatorProofViewUrl: this.proofViewUrl(r.platformToOperatorProofUrl),
    }));
  }

  async getOne(id: number, userId: number, role?: UserRole) {
    const staff = role === UserRole.ADMIN || role === UserRole.OPERATOR;
    const t = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        request: true,
        client: { select: { id: true, name: true, email: true, avatar: true } },
        operator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        platformAccount: true,
        messages: { take: 50, orderBy: { createdAt: 'desc' } },
        dispute: true,
        review: true,
      },
    });
    if (!t) throw new NotFoundException();
    if (!staff && t.clientId !== userId) throw new ForbiddenException();
    if (staff && role === UserRole.OPERATOR && t.operatorId !== userId) {
      throw new ForbiddenException();
    }
    if (!staff && t.clientId === userId) {
      const { operatorPaymentNumber: _hidden, ...rest } = t;
      return {
        ...rest,
        // Privacy: do not expose operator identity to clients
        operator: rest.operator
          ? { id: rest.operator.id, avatar: rest.operator.avatar }
          : null,
        operatorPaymentNumber: null,
        clientProofViewUrl: this.proofViewUrl(rest.clientProofUrl),
        operatorProofViewUrl: this.proofViewUrl(rest.operatorProofUrl),
        platformToOperatorProofViewUrl: this.proofViewUrl(rest.platformToOperatorProofUrl),
      };
    }
    return {
      ...t,
      clientProofViewUrl: this.proofViewUrl(t.clientProofUrl),
      operatorProofViewUrl: this.proofViewUrl(t.operatorProofUrl),
      platformToOperatorProofViewUrl: this.proofViewUrl(t.platformToOperatorProofUrl),
    };
  }

  async clientConfirmSend(
    transactionId: number,
    clientId: number,
    proofUrl: string | null,
  ) {
    const t = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        clientId,
        status: TransactionStatus.INITIATED,
      },
    });
    if (!t) throw new NotFoundException();

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: TransactionStatus.CLIENT_SENT,
        clientProofUrl: proofUrl ?? undefined,
        clientSentAt: new Date(),
      },
    });

    const full = await this.prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: { platformAccount: true, request: { select: { type: true } } },
    });
    const gross = full.grossAmount ?? full.amountCfa;
    const net = full.netAmount ?? gross - full.commissionAmount;

    await this.notifications.notifyAdmins({
      type: 'CLIENT_SENT_TO_PLATFORM',
      title: 'Virement client — à transférer à l’opérateur',
      body: `Transaction #${transactionId} : fonds attendus sur DoniSend. Transférer le net (${net.toString()} unités) vers l’opérateur.`,
      data: { transactionId },
    });

    await this.notifications.notify(t.operatorId, {
      type: 'CLIENT_PROOF_UPLOADED',
      title: 'Le client a envoyé ses fonds',
      body: 'DoniSend va vous reverser le montant net sous peu. Préparez l’envoi des roubles.',
      data: { transactionId },
    });

    const user = (await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true, phone: true, phoneMali: true, phoneRussia: true } as any,
    })) as any;
    if (user) {
      const gross =
        full.grossAmount ??
        (full.request?.type === RequestType.NEED_CFA
          ? full.amountRub
          : full.amountCfa);
      const grossLabel =
        full.request?.type === RequestType.NEED_CFA
          ? formatRUB(Number(gross))
          : formatCFA(Number(gross));
      void this.whatsapp
        .sendClientSentConfirmed({
          user: { name: user.name, phone: String(clientWhatsappPhone(user)) },
          transactionId,
          amountSent: grossLabel,
        })
        .catch(() => {});
    }

    return this.getOne(transactionId, clientId, UserRole.CLIENT);
  }

  async clientConfirmReceive(transactionId: number, clientId: number) {
    const t = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        clientId,
        status: TransactionStatus.OPERATOR_SENT,
      },
    });
    if (!t) throw new NotFoundException();

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.COMPLETED, completedAt: new Date() },
      });
      await tx.exchangeRequest.update({
        where: { id: t.requestId },
        data: { status: RequestStatus.COMPLETED },
      });
      await tx.user.updateMany({
        where: { id: { in: [clientId, t.operatorId] } },
        data: { transactionsCount: { increment: 1 } },
      });
    });

    await this.notifications.notify(t.operatorId, {
      type: 'TRANSACTION_COMPLETED',
      title: 'Transaction clôturée',
      body: 'Le client a confirmé la réception. Échange terminé avec succès.',
      data: { transactionId },
    });

    const done = (await this.prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: {
        request: { select: { type: true } },
        client: {
          select: { name: true, phone: true, phoneMali: true, phoneRussia: true } as any,
        },
        operator: { select: { name: true } },
      },
    })) as any;
    const commissionPct = await this.commissions.getCommissionEffectivePercent();
    let amountSent: string;
    let amountReceived: string;
    if (done.request.type === RequestType.NEED_RUB) {
      const gross = done.grossAmount ?? done.amountCfa;
      amountSent = formatCFA(Number(gross));
      amountReceived = formatRUB(Number(done.amountRub));
    } else {
      const gross = done.grossAmount ?? done.amountRub;
      amountSent = formatRUB(Number(gross));
      amountReceived = formatCFA(Number(done.amountCfa));
    }

    // Commission affichée en montant (devise d'envoi)
    const commissionAmountLabel =
      done.request.type === RequestType.NEED_RUB
        ? formatCFA(Number(done.commissionAmount))
        : formatRUB(Number(done.commissionAmount));

    const commissionStr = `${commissionPct}% -> ${commissionAmountLabel}`;

    // Générer un reçu PDF + URL publique (NotifML doit pouvoir récupérer le média sans auth)
    let receiptUrl: string | undefined;
    try {
      const directionLabel =
        done.request.type === RequestType.NEED_RUB ? 'CFA → RUB' : 'RUB → CFA';
      const { publicUrl } = await this.receipts.generateTransferReceiptPdf({
        transactionId,
        createdAt: done.createdAt,
        completedAt: done.completedAt,
        clientName: done.client.name,
        directionLabel,
        amountSentLabel: amountSent,
        amountReceivedLabel: amountReceived,
        commissionLabel: `${commissionPct}% (${commissionAmountLabel})`,
      });
      receiptUrl = publicUrl;
    } catch {
      // fail-soft: l'échange est déjà clôturé, on ne bloque pas la réponse
      receiptUrl = undefined;
    }

    void this.whatsapp
      .sendTransactionCompleted({
        user: {
          name: done.client.name,
          phone: String(clientWhatsappPhone(done.client)),
        },
        transactionId,
        amountSent,
        amountReceived,
        rate: commissionStr,
        receiptUrl,
      })
      .catch(() => {});

    return this.getOne(transactionId, clientId, UserRole.CLIENT);
  }

  async openDispute(
    transactionId: number,
    userId: number,
    dto: CreateDisputeDto,
  ) {
    const t = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        OR: [{ clientId: userId }, { operatorId: userId }],
      },
    });
    if (!t) throw new NotFoundException();
    if (
      t.status === TransactionStatus.CANCELLED ||
      t.status === TransactionStatus.COMPLETED
    ) {
      throw new BadRequestException('Transaction non éligible au litige');
    }
    const existing = await this.prisma.dispute.findUnique({
      where: { transactionId },
    });
    if (existing) throw new BadRequestException('Un litige existe déjà');

    const dispute = await this.prisma.$transaction(async (tx) => {
      const d = await tx.dispute.create({
        data: {
          transactionId,
          openedBy: userId,
          reason: dto.reason,
          description: dto.description,
        },
      });
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.DISPUTED },
      });
      return d;
    });

    const opener = (await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true, phoneMali: true, phoneRussia: true } as any,
    })) as any;
    if (opener) {
      void this.whatsapp
        .sendDisputeOpened({
          user: { name: opener.name, phone: String(clientWhatsappPhone(opener)) },
          transactionId,
          disputeId: dispute.id,
        })
        .catch(() => {});
    }

    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    await Promise.all(
      admins.map((a) =>
        this.notifications.notify(a.id, {
          type: 'DISPUTE_OPENED',
          title: 'Nouveau litige',
          body: `Litige sur la transaction #${transactionId}`,
          data: { transactionId },
        }),
      ),
    );

    const role = t.clientId === userId ? UserRole.CLIENT : UserRole.OPERATOR;
    return this.getOne(transactionId, userId, role);
  }
}
