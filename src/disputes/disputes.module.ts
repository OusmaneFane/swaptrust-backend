import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [UploadModule, NotificationsModule, WhatsappModule],
  controllers: [DisputesController],
  providers: [DisputesService],
})
export class DisputesModule {}
