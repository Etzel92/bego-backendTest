import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateLocationDto {
  @ApiPropertyOptional({ example: 'Direccion' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  address?: string;

  @ApiPropertyOptional({
    example: 'String',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  placeId?: string;
}
