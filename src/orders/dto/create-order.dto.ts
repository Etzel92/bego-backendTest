import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class CreateOrderDto {

  @ApiProperty({ description: 'Truck ObjectId' })
  @IsMongoId()
  truck!: string;

  @ApiProperty({ description: 'Pickup Location ObjectId' })
  @IsMongoId()
  pickup!: string;

  @ApiProperty({ description: 'Dropoff Location ObjectId' })
  @IsMongoId()
  dropoff!: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
