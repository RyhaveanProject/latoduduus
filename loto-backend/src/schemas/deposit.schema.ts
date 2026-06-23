import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type DepositDocument = Deposit & Document;

@Schema({ timestamps: true })
export class Deposit {
  @Prop({
    type: String,
    default: () => uuidv4(),
  })
  _id!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true, enum: ['bank', 'crypto'] })
  paymentMethod!: string;

  @Prop({
    required: true,
    enum: ['AZN', 'RUB', 'TRY', 'GEL', 'USD'],
  })
  currency!: string;

  @Prop()
  cardNumber?: string;

  @Prop()
  cardHolder?: string;

  @Prop()
  walletAddress?: string;

  @Prop()
  walletNetwork?: string;

  @Prop()
  bankId?: string;

  @Prop()
  screenshotUrl?: string;

  @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected'] })
  status!: string;

  @Prop()
  rejectionReason?: string;

  @Prop()
  approvedAt?: Date;

  @Prop()
  rejectedAt?: Date;

  @Prop()
  approvedBy?: string;

  @Prop()
  telegramMessageId?: string;

  @Prop()
  telegramChatId?: string;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const DepositSchema = SchemaFactory.createForClass(Deposit);
