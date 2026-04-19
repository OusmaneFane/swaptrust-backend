import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePlatformAccountDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: '+22370000000' })
  @IsString()
  @MaxLength(191)
  accountNumber: string;

  @ApiProperty({ example: 'DoniSend — Orange Money' })
  @IsString()
  @MaxLength(191)
  accountName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
