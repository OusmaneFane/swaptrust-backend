import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class FilterTransactionsDto {
  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  period?: '7d' | '30d' | 'all';
}
