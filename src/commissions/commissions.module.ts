import { Module } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
