import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { RatesService } from './rates.service';

@ApiTags('Rates')
@Controller('rates')
export class RatesController {
  constructor(private readonly rates: RatesService) {}

  @Public()
  @Get('current')
  @ApiOperation({ summary: 'Taux actuel XOF/RUB' })
  current() {
    return this.rates.current();
  }

  @Public()
  @Get('history')
  @ApiOperation({ summary: 'Historique 24h' })
  history() {
    return this.rates.history24h();
  }

  @Public()
  @Get('calculate')
  @ApiOperation({ summary: 'Simulation de conversion' })
  calculate(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.rates.calculate(amount, from, to);
  }
}
