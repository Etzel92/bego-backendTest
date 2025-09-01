import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  placeId!: string;
}
