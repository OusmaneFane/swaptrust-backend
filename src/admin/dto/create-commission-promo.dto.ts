import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, Max, Min } from 'class-validator';

export class CreateCommissionPromoDto {
  @ApiProperty({ example: 1, description: 'Commission promo en % (0–100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  percent: number;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z', description: 'Date de fin (ISO)' })
  @IsDateString()
  endsAt: string;

  @ApiPropertyOptional({ example: '2026-04-20T00:00:00.000Z', description: 'Date de début (ISO)' })
  @IsDateString()
  startsAt?: string;
}

