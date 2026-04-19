import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Paramètres publics pour le frontend (landing, estimation, etc.)' })
  getPublic() {
    return {
      commissionPercent: this.settings.getCommissionPercent() ?? 0,
    };
  }
}

