import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  private cacheKey(from: string, to: string) {
    return `rate:${from}:${to}`;
  }

  /** Taux `from` → `to` (multiplicateur décimal). */
  async getRateDecimal(from: string, to: string): Promise<number> {
    if (from === to) return 1;
    const cached = await this.redis.get(this.cacheKey(from, to));
    if (cached) return parseFloat(cached);

    const row = await this.prisma.exchangeRate.findFirst({
      where: { fromCurrency: from, toCurrency: to },
      orderBy: { fetchedAt: 'desc' },
    });
    if (row) {
      const v = row.rate.toNumber();
      await this.redis.setex(this.cacheKey(from, to), 600, String(v));
      return v;
    }

    const latest = await this.fetchAndStore();
    const hit = latest.find((r) => r.from === from && r.to === to);
    if (!hit) throw new ServiceUnavailableException('Rate unavailable');
    return hit.rate;
  }

  async fetchAndStore(): Promise<{ from: string; to: string; rate: number }[]> {
    const apiKey = this.config.get<string>('exchangeRate.apiKey');
    const baseUrl = this.config.get<string>('exchangeRate.apiUrl') ?? 'https://openexchangerates.org/api';
    const pairs = [
      ['XOF', 'RUB'],
      ['RUB', 'XOF'],
    ];

    if (!apiKey) {
      this.logger.warn('EXCHANGE_RATE_API_KEY missing — using fallback static rates');
      const fallback = [
        { from: 'XOF', to: 'RUB', rate: 0.14 },
        { from: 'RUB', to: 'XOF', rate: 7.14 },
      ];
      for (const f of fallback) {
        await this.prisma.exchangeRate.create({
          data: {
            fromCurrency: f.from,
            toCurrency: f.to,
            rate: new Prisma.Decimal(f.rate.toFixed(6)),
            source: 'fallback',
          },
        });
        await this.redis.setex(this.cacheKey(f.from, f.to), 3600, String(f.rate));
      }
      return fallback;
    }

    const url = `${baseUrl.replace(/\/$/, '')}/latest.json`;
    const { data } = await axios.get<{ rates: Record<string, number> }>(url, {
      params: { app_id: apiKey },
    });
    const r = data.rates;
    if (!r?.XOF || !r?.RUB) throw new Error('Invalid OXR response');

    const xofPerUsd = r.XOF;
    const rubPerUsd = r.RUB;
    const xofToRub = rubPerUsd / xofPerUsd;
    const rubToXof = xofPerUsd / rubPerUsd;

    const out = [
      { from: 'XOF', to: 'RUB', rate: xofToRub },
      { from: 'RUB', to: 'XOF', rate: rubToXof },
    ];

    for (const f of out) {
      await this.prisma.exchangeRate.create({
        data: {
          fromCurrency: f.from,
          toCurrency: f.to,
          rate: new Prisma.Decimal(f.rate.toFixed(6)),
          source: 'openexchangerates',
        },
      });
      await this.redis.setex(this.cacheKey(f.from, f.to), 900, String(f.rate));
    }
    return out;
  }

  async current() {
    const xofRub = await this.getRateDecimal('XOF', 'RUB');
    const rubXof = await this.getRateDecimal('RUB', 'XOF');
    return { XOF_RUB: xofRub, RUB_XOF: rubXof, fetchedAt: new Date().toISOString() };
  }

  async history24h() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.prisma.exchangeRate.findMany({
      where: {
        fromCurrency: 'XOF',
        toCurrency: 'RUB',
        fetchedAt: { gte: since },
      },
      orderBy: { fetchedAt: 'asc' },
    });
  }

  async calculate(amount: string, from: string, to: string) {
    const a = BigInt(amount);
    const rate = await this.getRateDecimal(from, to);
    const converted = BigInt(Math.round(Number(a) * rate));
    return { amountFrom: a.toString(), from, to, rate, amountTo: converted.toString() };
  }
}
