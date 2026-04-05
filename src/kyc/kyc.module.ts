import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { UploadModule } from '../upload/upload.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [UploadModule, WhatsappModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
