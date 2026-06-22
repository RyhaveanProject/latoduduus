import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({
    type: String,
    default: () => uuidv4(),
  })
  _id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  gameId: string;

  @Prop({ required: true })
  roomId: string;

  @Prop({
    required: true,
    type: [{ row: Number, numbers: [Number] }],
  })
  card: Array<{
    row: number;
    numbers: number[];
  }>;

  @Prop({ default: [] })
  markedNumbers: number[];

  @Prop({ default: false })
  stage1Completed: boolean;

  @Prop({ default: false })
  stage2Completed: boolean;

  @Prop({ default: false })
  stage3Completed: boolean;

  @Prop({ default: 0 })
  entryFee: number;

  @Prop({ default: null })
  stage1Prize?: number;

  @Prop({ default: null })
  stage2Prize?: number;

  @Prop({ default: null })
  stage3Prize?: number;

  @Prop({ default: 0 })
  totalWinnings: number;

  @Prop({ default: 'active', enum: ['active', 'completed', 'cancelled'] })
  status: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
