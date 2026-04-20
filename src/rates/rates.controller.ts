import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RatesService } from './rates.service';
import { CommissionsService } from '../commissions/commissions.service';

@ApiTags('Rates')
@Controller('rates')
export class RatesController {
  constructor(
    private readonly rates: RatesService,
    private readonly commissions: CommissionsService,
  ) {}

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  @Public()
  @Get('current')
  @ApiOperation({
    summary:
      'Taux XOF/RUB : `rate` = Google Finance brut (affichage / échange transparent). `rateWithSpread` est informatif ; les demandes utilisent `rate` + commission séparée.',
  })
  async current() {
    const r = await this.rates.getCurrentRate();
    return {
      ...r,
      rate: this.round2(r.rate),
      rateWithSpread: this.round2(r.rateWithSpread),
      rubPerXof: this.round2(r.rubPerXof),
      rubPerXofWithSpread: this.round2(r.rubPerXofWithSpread),
      percentChange24h: this.round2(r.percentChange24h),
      commissionPercent: this.round2(await this.commissions.getCommissionEffectivePercent()),
    };
  }

  @Public()
  @Get('history')
  @ApiOperation({ summary: 'Historique XOF→RUB sur 24h' })
  async history() {
    const rows = await this.rates.getHistory();
    return rows.map((r) => ({ ...r, rate: this.round2(r.rate) }));
  }

  @Public()
  @Get('calculate')
  @ApiOperation({ summary: 'Simulation de conversion (montants en plus petite unité : centimes / kopecks)' })
  @ApiQuery({ name: 'amount', type: Number })
  @ApiQuery({ name: 'from', enum: ['XOF', 'RUB'] })
  @ApiQuery({ name: 'to', enum: ['XOF', 'RUB'] })
  async calculate(
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
    const r = await this.rates.calculate(amount, from as 'XOF' | 'RUB', to as 'XOF' | 'RUB');
    return {
      ...r,
      rate: this.round2(Number(r.rate)),
      googleRate: this.round2(Number(r.googleRate)),
    };
  }
}
