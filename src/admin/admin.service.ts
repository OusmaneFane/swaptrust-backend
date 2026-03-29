import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DisputeStatus,
  KycStatus,
  RequestStatus,
  TransactionStatus,
  UserRole,
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
      requestsPending,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.kycDocument.count({ where: { status: KycStatus.PENDING } }),
      this.prisma.transaction.count({
        where: {
          status: {
            in: [
              TransactionStatus.INITIATED,
              TransactionStatus.CLIENT_SENT,
              TransactionStatus.OPERATOR_VERIFIED,
              TransactionStatus.OPERATOR_SENT,
            ],
          },
        },
      }),
      this.prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
      this.prisma.exchangeRequest.count({
        where: { status: RequestStatus.PENDING, expiresAt: { gt: new Date() } },
      }),
    ]);
    return { users, kycPending, txActive, disputesOpen, requestsPending };
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
        role: true,
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
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        request: true,
        client: { select: { id: true, email: true, name: true } },
        operator: { select: { id: true, email: true, name: true } },
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
    const d = await this.prisma.dispute.findUnique({
      where: { id },
      include: { transaction: true },
    });
    if (!d) throw new NotFoundException();
    await this.prisma.$transaction(async (tx) => {
      await tx.dispute.update({
        where: { id },
        data: {
          status: DisputeStatus.RESOLVED,
          adminId,
          resolution,
          resolvedAt: new Date(),
        },
      });
      await tx.transaction.update({
        where: { id: d.transactionId },
        data: { status: TransactionStatus.COMPLETED, completedAt: new Date() },
      });
      await tx.exchangeRequest.update({
        where: { id: d.transaction.requestId },
        data: { status: RequestStatus.COMPLETED },
      });
    });
    return { resolved: true };
  }

  async kycPending() {
    return this.prisma.kycDocument.findMany({
      where: { status: KycStatus.PENDING },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async assignRole(userId: number, role: UserRole) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  async listOperators() {
    return this.prisma.user.findMany({
      where: { role: UserRole.OPERATOR },
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { id: 'desc' },
    });
  }

  async listAllRequests() {
    return this.prisma.exchangeRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        client: { select: { id: true, email: true, name: true } },
        transaction: { include: { operator: { select: { id: true, name: true } } } },
      },
    });
  }

  async listPendingRequests() {
    return this.prisma.exchangeRequest.findMany({
      where: { status: RequestStatus.PENDING, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'asc' },
      include: {
        client: { select: { id: true, email: true, name: true, phoneMali: true } },
      },
    });
  }
}
