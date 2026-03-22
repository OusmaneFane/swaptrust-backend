import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { OrdersModule } from '../orders/orders.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [OrdersModule, UploadModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
