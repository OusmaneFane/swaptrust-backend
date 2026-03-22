import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateDisputeDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  reason: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  description: string;
}
