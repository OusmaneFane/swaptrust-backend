import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RatesService } from './rates.service';

@Injectable()
export class RatesScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(RatesScheduler.name);

  constructor(private readonly ratesService: RatesService) {}

  async onApplicationBootstrap() {
    this.logger.log('Pré-chauffe du cache des taux…');
    await this.ratesService.fetchAndStore();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateRates() {
    this.logger.debug('Mise à jour planifiée du taux XOF/RUB…');
    await this.ratesService.fetchAndStore();
  }
}
