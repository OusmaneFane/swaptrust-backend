import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus, RequestType, TransactionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { CreateDisputeDto } from '../disputes/dto/create-dispute.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { clientWhatsappPhone } from '../common/utils/client-whatsapp-phone';
import { formatCFA, formatRUB } from '../common/utils/format-money';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly whatsapp: WhatsappService,
  ) {}

  private periodStart(period?: string) {
    if (period === '7d') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (period === '30d') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
        operator: { select: { id: true, name: true, avatar: true } },
      },
    });
    return rows.map(({ operatorPaymentNumber: _op, ...r }) => ({
      ...r,
      operatorPaymentNumber: null,
    }));
  }

  async getOne(id: number, userId: number, role?: UserRole) {
    const staff = role === UserRole.ADMIN || role === UserRole.OPERATOR;
    const t = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        request: true,
        client: { select: { id: true, name: true, email: true, avatar: true } },
        operator: { select: { id: true, name: true, email: true, avatar: true, role: true } },
        platformAccount: true,
        messages: { take: 50, orderBy: { createdAt: 'desc' } },
        dispute: true,
        review: true,
        ...(staff
          ? { operatorLogs: { orderBy: { createdAt: 'asc' } } }
          : {}),
      },
    });
    if (!t) throw new NotFoundException();
    if (!staff && t.clientId !== userId) throw new ForbiddenException();
    if (staff && role === UserRole.OPERATOR && t.operatorId !== userId) {
      throw new ForbiddenException();
    }
    if (!staff && t.clientId === userId) {
      const { operatorPaymentNumber: _hidden, ...rest } = t;
      return { ...rest, operatorPaymentNumber: null };
    }
    return t;
  }

  async clientConfirmSend(transactionId: number, clientId: number, proofUrl: string | null) {
    const t = await this.prisma.transaction.findFirst({
      where: { id: transactionId, clientId, status: TransactionStatus.INITIATED },
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

    const user = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true, phoneMali: true, phoneRussia: true },
    });
    if (user) {
      const gross =
        full.grossAmount ??
        (full.request?.type === RequestType.NEED_CFA ? full.amountRub : full.amountCfa);
      const grossLabel =
        full.request?.type === RequestType.NEED_CFA
          ? formatRUB(Number(gross))
          : formatCFA(Number(gross));
      void this.whatsapp
        .sendClientSentConfirmed({
          user: { name: user.name, phone: clientWhatsappPhone(user) },
          transactionId,
          amountSent: grossLabel,
        })
        .catch(() => {});
    }

    return this.getOne(transactionId, clientId, UserRole.CLIENT);
  }

  async clientConfirmReceive(transactionId: number, clientId: number) {
    const t = await this.prisma.transaction.findFirst({
      where: { id: transactionId, clientId, status: TransactionStatus.OPERATOR_SENT },
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

    const done = await this.prisma.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: {
        request: { select: { type: true } },
        client: { select: { name: true, phoneMali: true, phoneRussia: true } },
      },
    });
    const rateStr = `1 000 CFA = ${(Number(done.rate) * 1000).toFixed(2)} ₽`;
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
    void this.whatsapp
      .sendTransactionCompleted({
        user: {
          name: done.client.name,
          phone: clientWhatsappPhone(done.client),
        },
        transactionId,
        amountSent,
        amountReceived,
        rate: rateStr,
      })
      .catch(() => {});

    return this.getOne(transactionId, clientId, UserRole.CLIENT);
  }

  async openDispute(transactionId: number, userId: number, dto: CreateDisputeDto) {
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
    const existing = await this.prisma.dispute.findUnique({ where: { transactionId } });
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

    const opener = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phoneMali: true, phoneRussia: true },
    });
    if (opener) {
      void this.whatsapp
        .sendDisputeOpened({
          user: { name: opener.name, phone: clientWhatsappPhone(opener) },
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

    const role =
      t.clientId === userId ? UserRole.CLIENT : UserRole.OPERATOR;
    return this.getOne(transactionId, userId, role);
  }
}
