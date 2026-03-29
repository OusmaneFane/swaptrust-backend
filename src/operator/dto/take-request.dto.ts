import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TakeRequestDto {
  @ApiProperty({ description: 'Numéro sur lequel le client doit envoyer' })
  @IsString()
  operatorPaymentNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  operatorNote?: string;
}
