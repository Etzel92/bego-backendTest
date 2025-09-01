import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Location {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user!: Types.ObjectId;

  @Prop({ required: true })
  address!: string;

  // Usamos camelCase en código; corresponde al place_id de Google
  @Prop({ required: true })
  placeId!: string;

  @Prop({ required: true })
  latitude!: number;

  @Prop({ required: true })
  longitude!: number;
}

export type LocationDocument = Location & Document;
export const LocationSchema = SchemaFactory.createForClass(Location);

// Evita duplicados por usuario+placeId
LocationSchema.index({ user: 1, placeId: 1 }, { unique: true });
