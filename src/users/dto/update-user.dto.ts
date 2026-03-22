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

  @ApiPropertyOptional({ enum: CountryResidence })
  @IsOptional()
  @IsEnum(CountryResidence)
  countryResidence?: CountryResidence;
}
