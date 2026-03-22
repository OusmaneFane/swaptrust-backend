import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { mysqlConnectionUrl } from './mysql-connection-url';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    const url = mysqlConnectionUrl(config.getOrThrow<string>('DATABASE_URL'));
    const adapter = new PrismaMariaDb(url);
    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
