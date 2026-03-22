import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('redis.host');
    const port = this.config.get<number>('redis.port');
    try {
      this.client = new Redis({ host, port, maxRetriesPerRequest: 1, lazyConnect: true });
      void this.client.connect().catch(() => {
        this.logger.warn('Redis unavailable — OTP cache disabled');
        this.client?.disconnect();
        this.client = null;
      });
    } catch {
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.setex(key, seconds, value);
    } catch {
      /* ignore */
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      /* ignore */
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
