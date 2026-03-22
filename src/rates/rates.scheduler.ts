import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RatesService } from './rates.service';

@Injectable()
export class RatesScheduler {
  private readonly logger = new Logger(RatesScheduler.name);

  constructor(private readonly ratesService: RatesService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateRates() {
    try {
      await this.ratesService.fetchAndStore();
      this.logger.log('Exchange rates updated');
    } catch (err) {
      this.logger.error('Rate update failed', err);
    }
  }
}
