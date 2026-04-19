import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsappService } from './whatsapp.service';
import { WhatsappScheduler } from './whatsapp.scheduler';
import { CommissionsModule } from '../commissions/commissions.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 3,
    }),
    CommissionsModule,
  ],
  providers: [WhatsappService, WhatsappScheduler],
  exports: [WhatsappService],
})
export class WhatsappModule {}
