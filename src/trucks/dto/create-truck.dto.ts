import { IsMongoId, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTruckDto {
  @ApiProperty({})
  @IsMongoId()
  user!: string;

  @ApiProperty({ })
  @IsString()
  @MinLength(2)
  year!: string;

  @ApiProperty({})
  @IsString()
  @MinLength(2)
  color!: string;

  @ApiProperty({ })
  @IsString()
  @MinLength(3)
  plates!: string;
}
