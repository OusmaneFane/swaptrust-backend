import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsMobilePhone,
  IsISO31661Alpha2,
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

  @ApiProperty({
    example: '+33612345678',
    required: false,
    description:
      'Numéro principal au format international (E.164). Recommandé pour tous pays.',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: '33',
    required: false,
    description:
      'Indicatif pays (ex: 223, 7, 33). Utilisé si `phone` n’est pas en E.164.',
  })
  @IsOptional()
  @IsString()
  countryCallingCode?: string;

  @ApiProperty({
    example: 'FR',
    required: false,
    description: 'Code pays ISO-3166 alpha-2 (optionnel, pour le choix pays UI).',
  })
  @IsOptional()
  @IsISO31661Alpha2()
  countryIso2?: string;

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
