import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsappService } from './whatsapp.service';
import { WhatsappScheduler } from './whatsapp.scheduler';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 3,
    }),
  ],
  providers: [WhatsappService, WhatsappScheduler],
  exports: [WhatsappService],
})
export class WhatsappModule {}
