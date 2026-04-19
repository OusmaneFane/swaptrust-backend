import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const KEY_COMMISSION_PERCENT = 'commission.platformPercent';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private commissionPercent: number | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.refresh();
  }

  getCommissionPercent(): number | null {
    return this.commissionPercent;
  }

  async setCommissionPercent(percent: number): Promise<number> {
    const value = String(percent);
    await this.prisma.appSetting.upsert({
      where: { key: KEY_COMMISSION_PERCENT },
      create: { key: KEY_COMMISSION_PERCENT, value },
      update: { value },
    });
    this.commissionPercent = percent;
    return percent;
  }

  async refresh(): Promise<void> {
    try {
      const row = await this.prisma.appSetting.findUnique({ where: { key: KEY_COMMISSION_PERCENT } });
      if (row?.value !== undefined && row?.value !== null) {
        const n = parseFloat(row.value);
        if (Number.isFinite(n)) {
          this.commissionPercent = n;
          return;
        }
      }
    } catch (e) {
      this.logger.warn('Impossible de charger les settings en DB (fallback ENV)', e);
    }

    const fallback = this.config.get<number>('commission.platformPercent');
    this.commissionPercent = Number.isFinite(fallback as number) ? (fallback as number) : 0;
  }
}

