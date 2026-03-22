import { Injectable } from '@nestjs/common';
import {
  DisputeStatus,
  KycStatus,
  OrderStatus,
  TransactionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async dashboard() {
    const [
      users,
      kycPending,
      txActive,
      disputesOpen,
      ordersActive,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.kycDocument.count({ where: { status: KycStatus.PENDING } }),
      this.prisma.transaction.count({
        where: {
          status: {
            in: [
              TransactionStatus.INITIATED,
              TransactionStatus.SENDER_SENT,
              TransactionStatus.RECEIVER_CONFIRMED,
              TransactionStatus.RUB_SENT,
            ],
          },
        },
      }),
      this.prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
      this.prisma.order.count({ where: { status: OrderStatus.ACTIVE } }),
    ]);
    return { users, kycPending, txActive, disputesOpen, ordersActive };
  }

  async users(search?: string) {
    const where = search
      ? {
          OR: [
            { email: { contains: search } },
            { name: { contains: search } },
          ],
        }
      : {};
    return this.prisma.user.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 200,
      select: {
        id: true,
        email: true,
        name: true,
        kycStatus: true,
        isBanned: true,
        isAdmin: true,
        createdAt: true,
      },
    });
  }

  async banUser(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { isBanned: true },
    });
  }

  async transactions() {
    return this.prisma.transaction.findMany({
      orderBy: { initiatedAt: 'desc' },
      take: 200,
      include: {
        sender: { select: { id: true, email: true, name: true } },
        receiver: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async disputesQueue() {
    return this.prisma.dispute.findMany({
      where: { status: DisputeStatus.OPEN },
      include: { transaction: true },
    });
  }

  async resolveDispute(adminId: number, id: number, resolution: string) {
    const d = await this.prisma.dispute.findUnique({ where: { id } });
    if (!d) throw new Error('Not found');
    await this.prisma.$transaction([
      this.prisma.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.RESOLVED,
          adminId,
          resolution,
          resolvedAt: new Date(),
        },
      }),
      this.prisma.transaction.update({
        where: { id: d.transactionId },
        data: { status: TransactionStatus.COMPLETED },
      }),
    ]);
    return { resolved: true };
  }

  async kycPending() {
    return this.prisma.kycDocument.findMany({
      where: { status: KycStatus.PENDING },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }
}
