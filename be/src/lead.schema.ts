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
  referralSource: string;

  @Prop({ trim: true, default: '' })
  referralOther?: string;

  @Prop({ required: true, trim: true })
  currentLevel: string;

  @Prop({ required: true, trim: true })
  targetAim: string;

  @Prop({ trim: true, default: '' })
  expectedExamTime?: string;

  @Prop({ required: true, trim: true })
  testMode: string;

  @Prop({ required: true, trim: true })
  testDays: string;

  @Prop({ required: true, trim: true })
  testTimeSlot: string;

  @Prop({ required: true, trim: true })
  speakingSchedule: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
