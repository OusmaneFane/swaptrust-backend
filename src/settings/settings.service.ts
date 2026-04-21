import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const KEY_COMMISSION_BASE_PERCENT = 'commission.basePercent';

export interface CommissionPublicConfig {
  basePercent: number;
  promoPercent: number | null;
  promoEndsAt: string | null;
  effectivePercent: number;
  isPromoActive: boolean;
}

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private commissionBasePercent: number | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.refresh();
  }

  getCommissionBasePercent(): number | null {
    return this.commissionBasePercent;
  }

  async setCommissionBasePercent(percent: number): Promise<number> {
    const value = String(percent);
    await this.prisma.appSetting.upsert({
      where: { key: KEY_COMMISSION_BASE_PERCENT },
      create: { key: KEY_COMMISSION_BASE_PERCENT, value },
      update: { value },
    });
    this.commissionBasePercent = percent;
    return percent;
  }

  async getActiveCommissionPromo(): Promise<{
    promoPercent: number;
    promoEndsAtIso: string;
  } | null> {
    const now = new Date();
    const promo = await this.prisma.commissionPromo.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      orderBy: [{ endsAt: 'asc' }, { id: 'desc' }],
      select: { percent: true, endsAt: true },
    });
    if (!promo) return null;
    return {
      promoPercent: promo.percent.toNumber(),
      promoEndsAtIso: promo.endsAt.toISOString(),
    };
  }

  async createCommissionPromo(percent: number, endsAt: Date, startsAt?: Date) {
    const promo = await this.prisma.commissionPromo.create({
      data: {
        percent,
        endsAt,
        ...(startsAt ? { startsAt } : {}),
        isActive: true,
      },
      select: { id: true, percent: true, startsAt: true, endsAt: true, isActive: true },
    });
    return {
      id: promo.id,
      percent: promo.percent.toNumber(),
      startsAt: promo.startsAt.toISOString(),
      endsAt: promo.endsAt.toISOString(),
      isActive: promo.isActive,
    };
  }

  async deactivateCommissionPromo(id: number) {
    const promo = await this.prisma.commissionPromo.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
    return promo;
  }

  async listCommissionPromos(params?: { onlyActive?: boolean }) {
    const now = new Date();
    const rows = await this.prisma.commissionPromo.findMany({
      where: params?.onlyActive
        ? { isActive: true, endsAt: { gt: now } }
        : undefined,
      orderBy: [{ isActive: 'desc' }, { endsAt: 'desc' }, { id: 'desc' }],
      take: 100,
      select: { id: true, percent: true, startsAt: true, endsAt: true, isActive: true },
    });
    return rows.map((p) => ({
      id: p.id,
      percent: p.percent.toNumber(),
      startsAt: p.startsAt.toISOString(),
      endsAt: p.endsAt.toISOString(),
      isActive: p.isActive,
      isCurrentlyInWindow: p.startsAt <= now && p.endsAt > now && p.isActive,
    }));
  }

  async getCommissionPublicConfig(): Promise<CommissionPublicConfig> {
    const basePercent = this.getCommissionBasePercent() ?? 0;
    const promo = await this.getActiveCommissionPromo();
    const effectivePercent = promo?.promoPercent ?? basePercent;
    return {
      basePercent,
      promoPercent: promo?.promoPercent ?? null,
      promoEndsAt: promo?.promoEndsAtIso ?? null,
      effectivePercent,
      isPromoActive: Boolean(promo),
    };
  }

  async refresh(): Promise<void> {
    try {
      const row = await this.prisma.appSetting.findUnique({
        where: { key: KEY_COMMISSION_BASE_PERCENT },
      });
      if (row?.value !== undefined && row?.value !== null) {
        const n = parseFloat(row.value);
        if (Number.isFinite(n)) {
          this.commissionBasePercent = n;
          return;
        }
      }
    } catch (e) {
      this.logger.warn('Impossible de charger les settings en DB (fallback ENV)', e);
    }

    const fallback = this.config.get<number>('commission.platformPercent');
    this.commissionBasePercent = Number.isFinite(fallback as number) ? (fallback as number) : 0;
  }
}

