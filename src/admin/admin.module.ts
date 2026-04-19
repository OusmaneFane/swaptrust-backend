import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [WhatsappModule, SettingsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
