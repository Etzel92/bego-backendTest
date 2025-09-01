import { IsMongoId, IsString, MinLength } from 'class-validator';

export class CreateTruckDto {
  @IsMongoId()
  user!: string;

  @IsString()
  @MinLength(2)
  year!: string;

  @IsString()
  @MinLength(2)
  color!: string;

  @IsString()
  @MinLength(3)
  plates!: string;
}
