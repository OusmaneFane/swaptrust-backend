import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterTransactionsDto {
  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'sent | received' })
  @IsOptional()
  @IsString()
  direction?: 'sent' | 'received';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  period?: '7d' | '30d' | 'all';
}
