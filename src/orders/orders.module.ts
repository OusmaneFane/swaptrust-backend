import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MatchingService } from './matching.service';
import { RatesModule } from '../rates/rates.module';

@Module({
  imports: [RatesModule],
  controllers: [OrdersController],
  providers: [OrdersService, MatchingService],
  exports: [OrdersService, MatchingService],
})
export class OrdersModule {}
