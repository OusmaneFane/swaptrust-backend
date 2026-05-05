import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RequestType, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { WhatsappService } from './whatsapp.service';
import { clientWhatsappPhone } from '../common/utils/client-whatsapp-phone';
import { formatCFA, formatRUB } from '../common/utils/format-money';

const REMINDER_REDIS_PREFIX = 'wa:pay_reminder:';
const STALE_MS = 60 * 60 * 1000;

@Injectable()
export class WhatsappScheduler {
  private readonly logger = new Logger(WhatsappScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly whatsapp: WhatsappService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendPaymentReminders(): Promise<void> {
    const threshold = new Date(Date.now() - STALE_MS);
    const rows = (await this.prisma.transaction.findMany({
      where: {
        status: TransactionStatus.INITIATED,
        takenAt: { lte: threshold },
        expiresAt: { gt: new Date() },
      },
      include: {
        client: {
          select: { name: true, phone: true, phoneMali: true, phoneRussia: true } as any,
        },
        platformAccount: true,
        request: { select: { type: true } },
      },
    })) as any[];

    for (const tx of rows) {
      const key = `${REMINDER_REDIS_PREFIX}${tx.id}`;
      const already = await this.redis.get(key);
      if (already) continue;

      const phone = String(clientWhatsappPhone(tx.client));
      const platformNumber = tx.platformAccount?.accountNumber ?? "Voir dans l'app";
      const gross =
        tx.grossAmount ??
        (tx.request.type === RequestType.NEED_RUB ? tx.amountCfa : tx.amountRub);
      const exactStr =
        tx.request.type === RequestType.NEED_RUB
          ? formatCFA(Number(gross))
          : formatRUB(Number(gross));

      const minutesLeft = Math.max(
        1,
        Math.floor((new Date(tx.expiresAt).getTime() - Date.now()) / 60_000),
      );

      await this.whatsapp
        .sendSendReminder({
          user: { name: tx.client.name, phone },
          transactionId: tx.id,
          platformAccountNumber: platformNumber,
          exactAmount: exactStr,
          expiresInMin: minutesLeft,
        })
        .catch(() => {});

      const ttlSec = Math.max(60, minutesLeft * 60);
      await this.redis.setex(key, ttlSec, '1');
    }

    if (rows.length) {
      this.logger.debug(`Rappels paiement WhatsApp traités : ${rows.length} candidat(s)`);
    }
  }
}
