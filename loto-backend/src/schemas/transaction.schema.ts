import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({
    type: String,
    default: () => uuidv4(),
  })
  _id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({
    required: true,
    enum: ['deposit', 'withdraw', 'game_entry', 'game_winning', 'refund'],
  })
  type: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop()
  relatedGameId?: string;

  @Prop()
  relatedTicketId?: string;

  @Prop()
  relatedDepositId?: string;

  @Prop()
  relatedWithdrawId?: string;

  @Prop()
  description: string;

  @Prop({ default: 'completed', enum: ['pending', 'completed', 'failed'] })
  status: string;

  @Prop()
  failureReason?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
