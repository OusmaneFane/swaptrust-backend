import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CommissionBreakdown {
  googleRate: number;
  rateDisplay: string;
  requestedAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  totalToSend: number;
  netToOperator: number;
  clientReceives: number;
  currency: 'RUB' | 'XOF';
}

@Injectable()
export class CommissionsService {
  constructor(private readonly config: ConfigService) {}

  getCommissionPercent(): number {
    return this.config.get<number>('commission.platformPercent') ?? 2;
  }

  /**
   * @param requestedAmount — montant net (avant commission), en centimes / kopecks
   * @param googleRate — 1 XOF = googleRate RUB
   */
  calculate(
    requestedAmount: number,
    googleRate: number,
    sendCurrency: 'XOF' | 'RUB' = 'XOF',
  ): CommissionBreakdown {
    const commissionPercent = this.getCommissionPercent();
    const commissionAmount = Math.round((requestedAmount * commissionPercent) / 100);
    const totalToSend = requestedAmount + commissionAmount;
    const netToOperator = requestedAmount;
    const rateDisplay = `1 000 F CFA = ${(googleRate * 1000).toFixed(2)} ₽`;

    if (sendCurrency === 'XOF') {
      const clientReceives = Math.round(requestedAmount * googleRate);
      return {
        googleRate,
        rateDisplay,
        requestedAmount,
        commissionPercent,
        commissionAmount,
        totalToSend,
        netToOperator,
        clientReceives,
        currency: 'RUB',
      };
    }

    const clientReceives = Math.round(requestedAmount / googleRate);
    return {
      googleRate,
      rateDisplay,
      requestedAmount,
      commissionPercent,
      commissionAmount,
      totalToSend,
      netToOperator,
      clientReceives,
      currency: 'XOF',
    };
  }
}
