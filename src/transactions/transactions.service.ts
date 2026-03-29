import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus, TransactionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';
import { CreateDisputeDto } from '../disputes/dto/create-dispute.dto';

const HOURS_24 = 24 * 60 * 60 * 1000;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
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

    return this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        request: true,
        operator: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async getOne(id: number, userId: number, role?: UserRole) {
    const staff = role === UserRole.ADMIN || role === UserRole.OPERATOR;
    const t = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        request: true,
        client: { select: { id: true, name: true, email: true, avatar: true } },
        operator: { select: { id: true, name: true, email: true, avatar: true, role: true } },
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

    await this.notifications.notify(t.operatorId, {
      type: 'CLIENT_PROOF_UPLOADED',
      title: 'Reçu client uploadé',
      body: 'Le client a envoyé ses fonds et uploadé son reçu. Vérifiez et envoyez en retour.',
      data: { transactionId },
    });

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

    await this.prisma.$transaction(async (tx) => {
      await tx.dispute.create({
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
    });

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
