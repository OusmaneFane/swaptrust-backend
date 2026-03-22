import { ApiProperty } from '@nestjs/swagger';
import { OrderType, PaymentMethod } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsMobilePhone, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @ApiProperty({ enum: OrderType })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({ example: '5000000', description: 'Montant source (minor units / centimes)' })
  @Type(() => String)
  @IsString()
  amountFrom: string;

  @ApiProperty({ example: 'XOF' })
  @IsString()
  currencyFrom: string;

  @ApiProperty({ example: 'RUB' })
  @IsString()
  currencyTo: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty()
  @IsMobilePhone()
  phoneReceive: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
