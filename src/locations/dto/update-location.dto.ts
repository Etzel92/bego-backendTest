import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateLocationDto {
  @ApiPropertyOptional({ example: 'Av. Siempre Viva 742, CDMX' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  address?: string;

  @ApiPropertyOptional({
    example: 'ChIJsUDXn2od0oURpAnsjV2k44A',
    description: 'Nuevo placeId; al cambiarlo se recalculan address/lat/lng desde Google Places',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  placeId?: string;
}
