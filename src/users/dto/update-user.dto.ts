import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsMobilePhone, MinLength } from 'class-validator';
import { CountryResidence } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMobilePhone()
  phoneMali?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMobilePhone()
  phoneRussia?: string;

  @ApiPropertyOptional({
    description: 'Numéro principal au format international (E.164), tous pays.',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: CountryResidence })
  @IsOptional()
  @IsEnum(CountryResidence)
  countryResidence?: CountryResidence;
}
