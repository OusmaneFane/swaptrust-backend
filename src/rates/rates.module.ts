import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { RatesController } from './rates.controller';
import { RatesService } from './rates.service';
import { RatesScheduler } from './rates.scheduler';
import { CommissionsModule } from '../commissions/commissions.module';

@Module({
  imports: [
    CommissionsModule,
    HttpModule.register({
      timeout: 15_000,
      maxRedirects: 3,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('redis.host') ?? 'localhost';
        const port = config.get<number>('redis.port') ?? 6379;
        return {
          stores: [createKeyv(`redis://${host}:${port}`)],
        };
      },
    }),
  ],
  controllers: [RatesController],
  providers: [RatesService, RatesScheduler],
  exports: [RatesService],
})
export class RatesModule {}
