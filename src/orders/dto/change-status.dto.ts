import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class ChangeStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @Transform(({ value }) =>
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
  )
  @IsEnum(OrderStatus, {
    message: 'status must be one of the following values: created, in_transit, completed',
  })
  status!: OrderStatus;
}
