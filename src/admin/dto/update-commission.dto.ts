import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateCommissionDto {
  @ApiProperty({ example: 0, description: 'Commission plateforme en % (0–100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  percent: number;
}

