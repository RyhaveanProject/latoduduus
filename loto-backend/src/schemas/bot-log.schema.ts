import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type BotLogDocument = BotLog & Document;

@Schema({ timestamps: true })
export class BotLog {
  @Prop({
    type: String,
    default: () => uuidv4(),
    unique: true,
  })
  _id: string;

  @Prop()
  telegramUserId?: string;

  @Prop()
  relatedUserId?: string;

  @Prop({
    required: true,
    enum: ['deposit_request', 'withdraw_request', 'approval', 'rejection', 'error'],
  })
  action: string;

  @Prop()
  amount?: number;

  @Prop()
  messageId?: string;

  @Prop()
  messageText: string;

  @Prop()
  callbackData?: string;

  @Prop()
  metadata?: Record<string, any>;

  @Prop({ default: 'success', enum: ['success', 'error'] })
  status: string;

  @Prop()
  errorMessage?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const BotLogSchema = SchemaFactory.createForClass(BotLog);
