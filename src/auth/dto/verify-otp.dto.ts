import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+22376543210' })
  @IsMobilePhone()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 8)
  code: string;
}
