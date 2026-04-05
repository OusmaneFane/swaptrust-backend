import { Module } from '@nestjs/common';
import { OperatorController } from './operator.controller';
import { OperatorService } from './operator.service';
import { RequestsModule } from '../requests/requests.module';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [RequestsModule, UploadModule, NotificationsModule, WhatsappModule],
  controllers: [OperatorController],
  providers: [OperatorService],
})
export class OperatorModule {}
