import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  OrderType,
  TransactionStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MatchingService } from '../orders/matching.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FilterTransactionsDto } from './dto/filter-transactions.dto';

const HOURS_48 = 48 * 60 * 60 * 1000;

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private matching: MatchingService,
  ) {}

  private periodStart(period?: string) {
    if (period === '7d') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (period === '30d') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return undefined;
  }

  async listForUser(userId: number, q: FilterTransactionsDto) {
    const since = this.periodStart(q.period);
    const base: Prisma.TransactionWhereInput = {};
    if (since) base.initiatedAt = { gte: since };
    if (q.status) base.status = q.status;

    if (q.direction === 'sent') {
      base.senderId = userId;
    } else if (q.direction === 'received') {
      base.receiverId = userId;
    } else {
      base.OR = [{ senderId: userId }, { receiverId: userId }];
    }

    return this.prisma.transaction.findMany({
      where: base,
      orderBy: { initiatedAt: 'desc' },
      include: {
        order: true,
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async create(userId: number, dto: CreateTransactionDto) {
    const [mine, peer] = await Promise.all([
      this.prisma.order.findUnique({
        where: { id: dto.myOrderId },
        include: { transaction: true },
      }),
      this.prisma.order.findUnique({
        where: { id: dto.peerOrderId },
        include: { transaction: true },
      }),
    ]);
    if (!mine || !peer) throw new NotFoundException('Order not found');
    if (mine.userId !== userId) throw new ForbiddenException();
    if (mine.status !== OrderStatus.ACTIVE || peer.status !== OrderStatus.ACTIVE) {
      throw new BadRequestException('Orders must be active');
    }
    if (mine.type === peer.type) throw new BadRequestException('Order types must differ');

    const matches = await this.matching.findMatches(mine.id);
    const ok = matches.some((m) => m.id === peer.id);
    if (!ok) throw new BadRequestException('Orders are not compatible');

    if (peer.transaction || mine.transaction) {
      throw new BadRequestException('Order already matched');
    }

    const sendCfa =
      mine.type === OrderType.SEND_CFA ? mine : peer.type === OrderType.SEND_CFA ? peer : null;
    const sendRub =
      mine.type === OrderType.SEND_RUB ? mine : peer.type === OrderType.SEND_RUB ? peer : null;
    if (!sendCfa || !sendRub) throw new BadRequestException('Invalid pair');

    const senderId = sendCfa.userId;
    const receiverId = sendRub.userId;

    const tx = await this.prisma.$transaction(async (db) => {
      const t = await db.transaction.create({
        data: {
          orderId: mine.id,
          peerOrderId: peer.id,
          senderId,
          receiverId,
          amountCfa: sendCfa.amountFrom,
          amountRub: sendRub.amountFrom,
          rate: sendCfa.rate,
          commissionAmount: sendCfa.commission + sendRub.commission,
          status: TransactionStatus.INITIATED,
          expiresAt: new Date(Date.now() + HOURS_48),
        },
      });
      await db.order.update({
        where: { id: mine.id },
        data: { status: OrderStatus.MATCHED },
      });
      await db.order.update({
        where: { id: peer.id },
        data: { status: OrderStatus.MATCHED },
      });
      return t;
    });

    return this.getOne(tx.id, userId);
  }

  async getOne(id: number, userId: number) {
    const t = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        order: true,
        sender: { select: { id: true, name: true, email: true, avatar: true } },
        receiver: { select: { id: true, name: true, email: true, avatar: true } },
        messages: { take: 50, orderBy: { createdAt: 'desc' } },
        dispute: true,
        review: true,
      },
    });
    if (!t) throw new NotFoundException();
    if (t.senderId !== userId && t.receiverId !== userId) throw new ForbiddenException();
    return t;
  }

  async confirmSend(userId: number, id: number, proofUrl: string | null) {
    const t = await this.prisma.transaction.findUnique({ where: { id } });
    if (!t) throw new NotFoundException();
    if (t.senderId !== userId) throw new ForbiddenException();
    if (t.status !== TransactionStatus.INITIATED) {
      throw new BadRequestException('Invalid status');
    }
    return this.prisma.transaction.update({
      where: { id },
      data: { status: TransactionStatus.SENDER_SENT, proofUrl: proofUrl ?? undefined },
    });
  }

  async confirmReceive(userId: number, id: number) {
    const t = await this.prisma.transaction.findUnique({ where: { id } });
    if (!t) throw new NotFoundException();
    if (t.receiverId !== userId) throw new ForbiddenException();
    if (t.status !== TransactionStatus.SENDER_SENT) {
      throw new BadRequestException('Invalid status');
    }
    return this.prisma.$transaction(async (db) => {
      const updated = await db.transaction.update({
        where: { id },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
      await db.order.update({
        where: { id: t.orderId },
        data: { status: OrderStatus.COMPLETED },
      });
      if (t.peerOrderId) {
        await db.order.update({
          where: { id: t.peerOrderId },
          data: { status: OrderStatus.COMPLETED },
        });
      }
      await db.user.update({
        where: { id: t.senderId },
        data: { transactionsCount: { increment: 1 } },
      });
      await db.user.update({
        where: { id: t.receiverId },
        data: { transactionsCount: { increment: 1 } },
      });
      return updated;
    });
  }

  async cancel(userId: number, id: number) {
    const t = await this.prisma.transaction.findUnique({
      where: { id },
      include: { order: true },
    });
    if (!t) throw new NotFoundException();
    if (t.senderId !== userId && t.receiverId !== userId) throw new ForbiddenException();
    if (
      t.status === TransactionStatus.COMPLETED ||
      t.status === TransactionStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot cancel');
    }
    return this.prisma.$transaction(async (db) => {
      await db.transaction.update({
        where: { id },
        data: { status: TransactionStatus.CANCELLED },
      });
      const ids = [t.orderId, t.peerOrderId].filter((x): x is number => x != null);
      await db.order.updateMany({
        where: { id: { in: ids } },
        data: { status: OrderStatus.ACTIVE },
      });
      return { cancelled: true };
    });
  }
}
