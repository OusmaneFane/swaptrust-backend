import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '+22376543210' })
  @IsMobilePhone()
  phone: string;
}
