import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsOptional, IsPositive, Min } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class OrdersQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  limit?: number = 10;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Filter by Truck id' })
  @IsOptional()
  @IsMongoId()
  truck?: string;

  @ApiPropertyOptional({ description: 'Filter by User id (admin only / mismo user)' })
  @IsOptional()
  @IsMongoId()
  user?: string;

  @ApiPropertyOptional({ description: 'Populate relations', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  expand?: boolean = false;
}
