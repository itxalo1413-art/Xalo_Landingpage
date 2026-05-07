import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LeadDocument = HydratedDocument<Lead>;

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, trim: true, unique: true })
  phone: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  email: string;

  @Prop({ required: true, trim: true })
  motivation: string;

  @Prop({ trim: true, default: '' })
  otherReason?: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
