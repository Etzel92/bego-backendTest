import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrderStatus } from '../enums/order-status.enum';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true, versionKey: false })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Truck', required: true, index: true })
  truck!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.CREATED,
    index: true,
  })
  status!: OrderStatus;

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  pickup!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  dropoff!: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Índices útiles
OrderSchema.index({ user: 1, status: 1, createdAt: -1 });
OrderSchema.index({ truck: 1, status: 1 });
