import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, RequestType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterRequestsDto {
  @ApiPropertyOptional({ enum: RequestType })
  @IsOptional()
  @IsEnum(RequestType)
  type?: RequestType;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;
}
