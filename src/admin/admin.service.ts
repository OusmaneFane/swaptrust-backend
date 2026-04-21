import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  DisputeStatus,
  KycStatus,
  RequestStatus,
  RequestType,
  TransactionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlatformAccountDto } from './dto/create-platform-account.dto';
import { UpdatePlatformAccountDto } from './dto/update-platform-account.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { clientWhatsappPhone } from '../common/utils/client-whatsapp-phone';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly settings: SettingsService,
  ) {}

  getCommissionPercent() {
    return { percent: this.settings.getCommissionBasePercent() ?? 0 };
  }

  async updateCommissionPercent(percent: number) {
    const p = await this.settings.setCommissionBasePercent(percent);
    return { percent: p };
  }

  async getCommissionPublicConfig() {
    const c = await this.settings.getCommissionPublicConfig();
    return {
      basePercent: c.basePercent,
      promoPercent: c.promoPercent,
      promoEndsAt: c.promoEndsAt,
      effectivePercent: c.effectivePercent,
      isPromoActive: c.isPromoActive,
    };
  }

  async createCommissionPromo(percent: number, endsAtIso: string, startsAtIso?: string) {
    const endsAt = new Date(endsAtIso);
    const startsAt = startsAtIso ? new Date(startsAtIso) : undefined;
    if (!Number.isFinite(endsAt.getTime())) throw new BadRequestException('endsAt invalide');
    if (startsAt && !Number.isFinite(startsAt.getTime())) throw new BadRequestException('startsAt invalide');
    if (endsAt.getTime() <= Date.now()) throw new BadRequestException('endsAt doit être dans le futur');
    if (startsAt && startsAt.getTime() >= endsAt.getTime()) {
      throw new BadRequestException('startsAt doit être avant endsAt');
    }
    return this.settings.createCommissionPromo(percent, endsAt, startsAt);
  }

  async deactivateCommissionPromo(id: number) {
    try {
      return await this.settings.deactivateCommissionPromo(id);
    } catch {
      throw new NotFoundException();
    }
  }

  async listCommissionPromos(onlyActive?: boolean) {
    return this.settings.listCommissionPromos({ onlyActive });
  }

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
        platformAccount: true,
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
      include: {
        transaction: {
          include: {
            client: { select: { name: true, phoneMali: true, phoneRussia: true } },
          },
        },
      },
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

    const c = d.transaction.client;
    void this.whatsapp
      .sendDisputeResolved({
        user: { name: c.name, phone: clientWhatsappPhone(c) },
        transactionId: d.transactionId,
        resolution,
      })
      .catch(() => {});

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

  async listPlatformAccounts() {
    return this.prisma.platformAccount.findMany({ orderBy: [{ method: 'asc' }, { id: 'asc' }] });
  }

  async createPlatformAccount(dto: CreatePlatformAccountDto) {
    return this.prisma.platformAccount.create({
      data: {
        method: dto.method,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updatePlatformAccount(id: number, dto: UpdatePlatformAccountDto) {
    try {
      return await this.prisma.platformAccount.update({
        where: { id },
        data: dto,
      });
    } catch {
      throw new NotFoundException();
    }
  }

  async deactivatePlatformAccount(id: number) {
    try {
      return await this.prisma.platformAccount.update({
        where: { id },
        data: { isActive: false },
      });
    } catch {
      throw new NotFoundException();
    }
  }

  private revenuePeriodStart(period: string): Date | undefined {
    const now = Date.now();
    if (period === 'day') return new Date(now - 24 * 60 * 60 * 1000);
    if (period === 'week') return new Date(now - 7 * 24 * 60 * 60 * 1000);
    if (period === 'month') return new Date(now - 30 * 24 * 60 * 60 * 1000);
    if (period === 'year') return new Date(now - 365 * 24 * 60 * 60 * 1000);
    throw new BadRequestException('period doit être day, week, month ou year');
  }

  /**
   * Volume / commissions en centimes CFA pour les transactions NEED_RUB (client envoie du CFA).
   */
  async revenueSummary(period: string) {
    const since = this.revenuePeriodStart(period);
    const txs = await this.prisma.transaction.findMany({
      where: {
        status: TransactionStatus.COMPLETED,
        completedAt: { gte: since },
      },
      include: { request: { select: { type: true } } },
    });

    let totalVolumeCfa = BigInt(0);
    let totalCommissionCfa = BigInt(0);
    for (const tx of txs) {
      if (tx.request.type !== RequestType.NEED_RUB) continue;
      const gross = tx.grossAmount ?? tx.amountCfa;
      const net = tx.netAmount ?? gross - tx.commissionAmount;
      totalVolumeCfa += net;
      totalCommissionCfa += tx.commissionAmount;
    }

    const pending = await this.prisma.transaction.findMany({
      where: {
        status: TransactionStatus.CLIENT_SENT,
        platformTransferredAt: null,
      },
      select: {
        netAmount: true,
        grossAmount: true,
        commissionAmount: true,
        amountCfa: true,
      },
    });

    let pendingAmount = BigInt(0);
    for (const p of pending) {
      const gross = p.grossAmount ?? p.amountCfa;
      pendingAmount += p.netAmount ?? gross - p.commissionAmount;
    }

    return {
      period,
      transactionCount: txs.filter((t) => t.request.type === RequestType.NEED_RUB).length,
      totalVolumeCfa: totalVolumeCfa.toString(),
      totalCommissionCfa: totalCommissionCfa.toString(),
      pendingTransfers: pending.length,
      pendingAmount: pendingAmount.toString(),
    };
  }
}
