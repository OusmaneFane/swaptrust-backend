import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { ReceiptsModule } from '../receipts/receipts.module';

@Module({
  imports: [
    UploadModule,
    NotificationsModule,
    WhatsappModule,
    CommissionsModule,
    ReceiptsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
