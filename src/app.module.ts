import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import jwtConfig from './config/jwt.config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { KycModule } from './kyc/kyc.module';
import { RequestsModule } from './requests/requests.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ChatModule } from './chat/chat.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DisputesModule } from './disputes/disputes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RatesModule } from './rates/rates.module';
import { AdminModule } from './admin/admin.module';
import { OperatorModule } from './operator/operator.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HealthModule } from './health/health.module';
import { ProofsModule } from './proofs/proofs.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, jwtConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    KycModule,
    RequestsModule,
    TransactionsModule,
    ChatModule,
    ReviewsModule,
    DisputesModule,
    NotificationsModule,
    RatesModule,
    AdminModule,
    OperatorModule,
    HealthModule,
    ProofsModule,
    WhatsappModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
