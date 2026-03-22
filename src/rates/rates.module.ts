import { Module } from '@nestjs/common';
import { RatesService } from './rates.service';
import { RatesController } from './rates.controller';
import { RatesScheduler } from './rates.scheduler';

@Module({
  controllers: [RatesController],
  providers: [RatesService, RatesScheduler],
  exports: [RatesService],
})
export class RatesModule {}
