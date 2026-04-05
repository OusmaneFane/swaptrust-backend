import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [UploadModule, NotificationsModule, WhatsappModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
