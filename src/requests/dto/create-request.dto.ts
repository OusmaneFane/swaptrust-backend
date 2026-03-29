import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, RequestType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRequestDto {
  @ApiProperty({ enum: RequestType })
  @IsEnum(RequestType)
  type: RequestType;

  @ApiProperty({ description: 'Montant souhaité en centimes / kopecks' })
  @IsInt()
  @Min(100)
  amountWanted: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Numéro du client pour recevoir les fonds' })
  @IsString()
  phoneToSend: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
