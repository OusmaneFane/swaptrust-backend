import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

@Module({
  imports: [ConfigModule],
  controllers: [LegalController],
  providers: [LegalService],
})
export class LegalModule {}

