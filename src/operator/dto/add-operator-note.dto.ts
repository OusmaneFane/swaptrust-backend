import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AddOperatorNoteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  note: string;
}
