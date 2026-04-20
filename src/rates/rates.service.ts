import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { load } from 'cheerio';
import { firstValueFrom } from 'rxjs';
import type { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionsService } from '../commissions/commissions.service';

export interface RateResult {
  /** 1 XOF = rate RUB (sans spread). */
  rate: number;
  /** 1 XOF = rateWithSpread RUB (avec spread plateforme). */
  rateWithSpread: number;
  /** 1 RUB = rubPerXof XOF (sans spread) — pour affichage sans inversion côté client. */
  rubPerXof: number;
  /** 1 RUB = rubPerXofWithSpread XOF (avec spread). */
  rubPerXofWithSpread: number;
  source: 'google' | 'cache' | 'database' | 'fallback';
  fetchedAt: string;
  trend: 'up' | 'down' | 'stable';
  percentChange24h: number;
}

/** v2 : invalide les entrées Redis obsolètes (mauvais parse avant correctif RUB-XOF). */
const CACHE_KEY_CURRENT = 'rate:xof_rub:current:v2';
const CACHE_KEY_HISTORY = 'rate:xof_rub:history';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Plages grossières pour ignorer les autres `data-last-price` de la page (actus, paires liées). */
const GOOGLE_FINANCE_BANDS: Record<string, [number, number]> = {
  'XOF-RUB': [0.06, 0.35],
  'RUB-XOF': [4, 30],
  'XOF-USD': [0.0005, 0.01],
  'USD-RUB': [10, 300],
};

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly prisma: PrismaService,
    private readonly commissions: CommissionsService,
  ) {}

  private spreadPercent(): number {
    return (
      this.config.get<number>('rates.spreadPercent') ??
      this.config.get<number>('commission.spreadPercent') ??
      1
    );
  }

  private cacheTtlMs(): number {
    const sec = this.config.get<number>('rates.cacheTtlSeconds') ?? 300;
    return sec * 1000;
  }

  private async cacheGet<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cache.get<T>(key);
    } catch (e) {
      this.logger.warn(`Cache get ${key} failed`, e);
      return undefined;
    }
  }

  private async cacheSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttlMs);
    } catch (e) {
      this.logger.warn(`Cache set ${key} failed`, e);
    }
  }

  private async cacheDel(key: string): Promise<void> {
    try {
      await this.cache.del(key);
    } catch (e) {
      this.logger.warn(`Cache del ${key} failed`, e);
    }
  }

  /** Keyv/Redis peut renvoyer des nombres en string après désérialisation JSON. */
  private coerceRateResult(raw: Partial<RateResult>): RateResult | null {
    const rate = Number(raw.rate);
    const rateWithSpread = Number(raw.rateWithSpread);
    if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(rateWithSpread) || rateWithSpread <= 0) {
      return null;
    }
    const base = {
      ...raw,
      rate,
      rateWithSpread,
      fetchedAt: typeof raw.fetchedAt === 'string' ? raw.fetchedAt : new Date().toISOString(),
      trend: (raw.trend as RateResult['trend']) ?? 'stable',
      percentChange24h: Number(raw.percentChange24h) || 0,
      source: (raw.source as RateResult['source']) ?? 'cache',
    } as RateResult;
    return this.attachInverseRates(base);
  }

  private attachInverseRates(r: Omit<RateResult, 'rubPerXof' | 'rubPerXofWithSpread'>): RateResult {
    return {
      ...r,
      rubPerXof: 1 / r.rate,
      rubPerXofWithSpread: 1 / r.rateWithSpread,
    };
  }

  private async replaceCurrentCache(result: RateResult): Promise<void> {
    await this.cacheDel(CACHE_KEY_CURRENT);
    await this.cacheSet(CACHE_KEY_CURRENT, result, this.cacheTtlMs());
  }

  /** Taux XOF→RUB Google (sans spread) — base des montants et affichage transparent. */
  async getCurrentRateXofToRub(): Promise<{ rate: number }> {
    const r = await this.getCurrentRate();
    return { rate: r.rate };
  }

  /** Taux `from` → `to` (Google, sans spread), pour XOF/RUB uniquement. */
  async getRateDecimal(from: string, to: string): Promise<number> {
    if (from === to) return 1;
    const r = await this.getCurrentRate();
    if (from === 'XOF' && to === 'RUB') return r.rate;
    if (from === 'RUB' && to === 'XOF') return 1 / r.rate;
    throw new ServiceUnavailableException('Pair not supported');
  }

  /**
   * Taux enrichi : cache Redis → Google Finance → DB → config.
   */
  async getCurrentRate(): Promise<RateResult> {
    const cachedRaw = await this.cacheGet<Partial<RateResult>>(CACHE_KEY_CURRENT);
    const fromCache = cachedRaw ? this.coerceRateResult(cachedRaw) : null;
    if (fromCache) {
      this.logger.debug(
        `Taux servi depuis cache: XOF→RUB=${fromCache.rateWithSpread.toFixed(6)} (1 RUB=${fromCache.rubPerXofWithSpread.toFixed(4)} XOF)`,
      );
      return { ...fromCache, source: 'cache' };
    }

    try {
      const raw = await this.scrapeXofRubWithFallback();
      const result = await this.buildRateResult(raw, 'google');
      await this.replaceCurrentCache(result);
      await this.persistRate(raw);
      await this.cacheDel(CACHE_KEY_HISTORY);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Échec taux Google Finance: ${msg}`);
      return this.getFallbackRate();
    }
  }

  private async scrapeXofRubWithFallback(): Promise<number> {
    // La page RUB-XOF affiche ~7 (1 RUB en XOF) : moins ambiguë que ~0,14 sur XOF-RUB.
    try {
      const rubToXof = await this.scrapeGoogleFinance('RUB-XOF');
      const xofToRub = 1 / rubToXof;
      this.logger.log(`Taux dérivé RUB-XOF → XOF→RUB: ${xofToRub}`);
      return xofToRub;
    } catch {
      this.logger.warn('RUB-XOF indisponible, tentative XOF-RUB direct…');
    }
    try {
      return await this.scrapeGoogleFinance('XOF-RUB');
    } catch (e1) {
      this.logger.warn('XOF-RUB direct indisponible, tentative via USD…');
      return this.scrapeViaUsd();
    }
  }

  private async scrapeGoogleFinance(pair: string): Promise<number> {
    const url = `https://www.google.com/finance/quote/${pair}`;
    const { data } = await firstValueFrom(
      this.http.get<string>(url, {
        headers: {
          'User-Agent': UA,
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 8000,
        responseType: 'text',
      }),
    );

    const html = typeof data === 'string' ? data : String(data);
    const rate = this.parseRateFromHtml(html, pair);
    if (!rate || rate <= 0) {
      throw new Error(`Impossible de parser le taux (${pair})`);
    }
    this.logger.log(`Taux Google Finance ${pair}: ${rate}`);
    return rate;
  }

  private parseRateFromHtml(html: string, pair: string): number | null {
    const $ = load(html);
    const band = GOOGLE_FINANCE_BANDS[pair];
    const inBand = (n: number) =>
      band ? n >= band[0] && n <= band[1] : n > 0 && n < 1e9;

    const candidates: number[] = [];

    $('[data-last-price]').each((_, el) => {
      const raw = ($(el).attr('data-last-price') ?? '').replace(',', '.');
      const v = parseFloat(raw);
      if (Number.isFinite(v) && v > 0) candidates.push(v);
    });

    $('.YMlKec.fxKbKc').each((_, el) => {
      const text = $(el).text().replace(/\s/g, '').replace(',', '.');
      const v = parseFloat(text);
      if (Number.isFinite(v) && v > 0) candidates.push(v);
    });

    const priceRe = /"price":\s*([\d.]+)/g;
    let m: RegExpExecArray | null;
    while ((m = priceRe.exec(html)) !== null) {
      const v = parseFloat(m[1]);
      if (Number.isFinite(v) && v > 0) candidates.push(v);
    }

    const filtered = candidates.filter(inBand);
    const pool = filtered.length ? filtered : candidates;
    if (!pool.length) return null;

    pool.sort((a, b) => a - b);
    return pool[Math.floor(pool.length / 2)];
  }

  private async scrapeViaUsd(): Promise<number> {
    const [xofUsd, usdRub] = await Promise.all([
      this.scrapeGoogleFinance('XOF-USD'),
      this.scrapeGoogleFinance('USD-RUB'),
    ]);
    return xofUsd * usdRub;
  }

  private async buildRateResult(
    rate: number,
    source: RateResult['source'],
  ): Promise<RateResult> {
    const sp = this.spreadPercent();
    const rateWithSpread = rate * (1 - sp / 100);

    const oldest = await this.prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: 'XOF',
        toCurrency: 'RUB',
        fetchedAt: { gte: new Date(Date.now() - 25 * 60 * 60 * 1000) },
      },
      orderBy: { fetchedAt: 'asc' },
    });

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let percentChange24h = 0;

    if (oldest) {
      const oldRate = oldest.rate.toNumber();
      if (oldRate > 0) {
        percentChange24h = ((rate - oldRate) / oldRate) * 100;
        if (percentChange24h > 0.1) trend = 'up';
        if (percentChange24h < -0.1) trend = 'down';
      }
    }

    return this.attachInverseRates({
      rate,
      rateWithSpread,
      source,
      fetchedAt: new Date().toISOString(),
      trend,
      percentChange24h: Math.round(percentChange24h * 100) / 100,
    });
  }

  private async getFallbackRate(): Promise<RateResult> {
    const lastRate = await this.prisma.exchangeRate.findFirst({
      where: { fromCurrency: 'XOF', toCurrency: 'RUB' },
      orderBy: { fetchedAt: 'desc' },
    });

    if (lastRate) {
      const n = lastRate.rate.toNumber();
      this.logger.warn(`Fallback DB XOF/RUB: ${n}`);
      return await this.buildRateResult(n, 'database');
    }

    const fallback = this.config.get<number>('rates.fallbackRate') ?? 0.143;
    this.logger.error(`Fallback config XOF/RUB: ${fallback}`);
    const sp = this.spreadPercent();
    const rateWithSpread = fallback * (1 - sp / 100);
    return this.attachInverseRates({
      rate: fallback,
      rateWithSpread,
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
      trend: 'stable',
      percentChange24h: 0,
    });
  }

  private async persistRate(rate: number): Promise<void> {
    const inv = 1 / rate;
    await this.prisma.exchangeRate.createMany({
      data: [
        {
          fromCurrency: 'XOF',
          toCurrency: 'RUB',
          rate: new Prisma.Decimal(rate.toFixed(6)),
          source: 'google_finance',
        },
        {
          fromCurrency: 'RUB',
          toCurrency: 'XOF',
          rate: new Prisma.Decimal(inv.toFixed(6)),
          source: 'google_finance',
        },
      ],
    });
  }

  async getHistory(): Promise<Array<{ rate: number; fetchedAt: string }>> {
    const cached = await this.cacheGet<Array<{ rate: number; fetchedAt: string }>>(
      CACHE_KEY_HISTORY,
    );
    if (cached?.length) return cached;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const history = await this.prisma.exchangeRate.findMany({
      where: {
        fromCurrency: 'XOF',
        toCurrency: 'RUB',
        fetchedAt: { gte: since },
      },
      orderBy: { fetchedAt: 'asc' },
      select: { rate: true, fetchedAt: true },
    });

    const result = history.map((h) => ({
      rate: h.rate.toNumber(),
      fetchedAt: h.fetchedAt.toISOString(),
    }));

    await this.cacheSet(CACHE_KEY_HISTORY, result, 60_000);
    return result;
  }

  async calculate(amount: number, from: 'XOF' | 'RUB', to: 'XOF' | 'RUB') {
    if (from === to) {
      return {
        result: amount,
        rate: 1,
        googleRate: 1,
        commission: 0,
        total: amount,
        commissionPercent: this.commissions.getCommissionBasePercent(),
      };
    }

    const { rate: googleRate } = await this.getCurrentRate();

    if (from === 'XOF' && to === 'RUB') {
      const b = await this.commissions.calculate(amount, googleRate, 'XOF');
      return {
        ...b,
        result: b.clientReceives,
        rate: googleRate,
        commission: b.commissionAmount,
        total: b.totalToSend,
      };
    }

    const b = await this.commissions.calculate(amount, googleRate, 'RUB');
    return {
      ...b,
      result: b.clientReceives,
      rate: googleRate,
      commission: b.commissionAmount,
      total: b.totalToSend,
    };
  }

  /** Cron / bootstrap : rafraîchit cache + DB sans lire le cache courant. */
  async fetchAndStore(): Promise<void> {
    try {
      const raw = await this.scrapeXofRubWithFallback();
      const result = await this.buildRateResult(raw, 'google');
      await this.replaceCurrentCache(result);
      await this.cacheDel(CACHE_KEY_HISTORY);
      await this.persistRate(raw);
      this.logger.log(`Taux mis à jour XOF/RUB: ${raw}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Échec fetchAndStore: ${msg}`);
    }
  }

}
