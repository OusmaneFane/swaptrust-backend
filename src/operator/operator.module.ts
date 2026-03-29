import { Module } from '@nestjs/common';
import { OperatorController } from './operator.controller';
import { OperatorService } from './operator.service';
import { RequestsModule } from '../requests/requests.module';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [RequestsModule, UploadModule, NotificationsModule],
  controllers: [OperatorController],
  providers: [OperatorService],
})
export class OperatorModule {}
