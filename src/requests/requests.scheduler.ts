import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RequestsService } from './requests.service';

@Injectable()
export class RequestsScheduler {
  private readonly logger = new Logger(RequestsScheduler.name);

  constructor(private readonly requests: RequestsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async expirePendingRequests() {
    const n = await this.requests.expirePendingRequests();
    if (n > 0) this.logger.log(`${n} demande(s) expirée(s)`);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async alertSlowRequests() {
    await this.requests.alertSoonExpiringRequests();
  }
}
