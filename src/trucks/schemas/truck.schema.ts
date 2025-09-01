import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TruckDocument = HydratedDocument<Truck>;

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Truck {
  // virtual para tipado de salida
  id?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ required: true, trim: true })
  year: string;

  @Prop({ required: true, trim: true })
  color: string;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    unique: true,
    index: true,
  })
  plates: string;
}

export const TruckSchema = SchemaFactory.createForClass(Truck);

// Virtual id (string) desde _id
TruckSchema.virtual('id').get(function (this: any) {
  return this._id?.toHexString ? this._id.toHexString() : String(this._id);
});

// Limpiar _id en JSON
TruckSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    Reflect.deleteProperty(ret, '_id');
    return ret;
  },
});
