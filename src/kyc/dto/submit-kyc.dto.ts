import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SubmitKycDto {
  @ApiProperty({ example: 'PASSPORT' })
  @IsString()
  @MinLength(2)
  docType: string;
}
