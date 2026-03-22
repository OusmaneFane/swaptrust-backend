import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Mon ordre' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  myOrderId: number;

  @ApiProperty({ description: 'Ordre du contrepartie' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  peerOrderId: number;
}
