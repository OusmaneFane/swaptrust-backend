import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RatesService } from './rates.service';

@ApiTags('Rates')
@Controller('rates')
export class RatesController {
  constructor(private readonly rates: RatesService) {}

  @Public()
  @Get('current')
  @ApiOperation({
    summary:
      'Taux XOF/RUB (Google Finance, cache Redis, fallback DB). Utiliser rateWithSpread / rubPerXofWithSpread pour l’affichage (évite les erreurs d’inversion côté client).',
  })
  current() {
    return this.rates.getCurrentRate();
  }

  @Public()
  @Get('history')
  @ApiOperation({ summary: 'Historique XOF→RUB sur 24h' })
  history() {
    return this.rates.getHistory();
  }

  @Public()
  @Get('calculate')
  @ApiOperation({ summary: 'Simulation de conversion (montants en plus petite unité : centimes / kopecks)' })
  @ApiQuery({ name: 'amount', type: Number })
  @ApiQuery({ name: 'from', enum: ['XOF', 'RUB'] })
  @ApiQuery({ name: 'to', enum: ['XOF', 'RUB'] })
  calculate(
    @Query('amount') amountStr: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (amountStr === undefined || amountStr === '') {
      throw new BadRequestException('amount requis');
    }
    const amount = parseInt(amountStr, 10);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new BadRequestException('amount invalide');
    }
    if (from !== 'XOF' && from !== 'RUB') {
      throw new BadRequestException('from doit être XOF ou RUB');
    }
    if (to !== 'XOF' && to !== 'RUB') {
      throw new BadRequestException('to doit être XOF ou RUB');
    }
    return this.rates.calculate(amount, from as 'XOF' | 'RUB', to as 'XOF' | 'RUB');
  }
}
