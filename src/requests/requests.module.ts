import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RequestsScheduler } from './requests.scheduler';
import { RatesModule } from '../rates/rates.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [RatesModule, NotificationsModule],
  controllers: [RequestsController],
  providers: [RequestsService, RequestsScheduler],
  exports: [RequestsService],
})
export class RequestsModule {}
