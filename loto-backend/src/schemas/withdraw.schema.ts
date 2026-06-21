import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type WithdrawDocument = Withdraw & Document;

@Schema({ timestamps: true })
export class Withdraw {
  @Prop({
    type: String,
    default: () => uuidv4(),
    unique: true,
  })
  _id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['card', 'crypto'] })
  paymentMethod: string;

  @Prop({
    required: true,
    enum: ['AZ', 'RU', 'TR', 'GE', 'EN', 'AR', 'CN'],
  })
  currency: string;

  @Prop()
  cardNumber?: string;

  @Prop()
  walletAddress?: string;

  @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected'] })
  status: string;

  @Prop()
  rejectionReason?: string;

  @Prop()
  approvedAt?: Date;

  @Prop()
  rejectedAt?: Date;

  @Prop()
  approvedBy?: string;

  @Prop({ required: true })
  telegramMessageId?: string;

  @Prop({ required: true })
  telegramChatId?: string;

  @Prop()
  transactionHash?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const WithdrawSchema = SchemaFactory.createForClass(Withdraw);
