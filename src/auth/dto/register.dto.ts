import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsMobilePhone,
} from 'class-validator';
import { CountryResidence } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Ibrahim Koné' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ibrahim@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MotDePasse123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '+22376543210', required: false })
  @IsOptional()
  @IsMobilePhone()
  phoneMali?: string;

  @ApiProperty({ example: '+79161234567', required: false })
  @IsOptional()
  @IsMobilePhone()
  phoneRussia?: string;

  @ApiProperty({ enum: CountryResidence, default: CountryResidence.MALI })
  @IsEnum(CountryResidence)
  countryResidence: CountryResidence;
}
