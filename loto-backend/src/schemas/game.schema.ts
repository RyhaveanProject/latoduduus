import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type GameDocument = Game & Document;

@Schema({ timestamps: true })
export class Game {
  @Prop({ type: String, default: () => uuidv4() })
  _id!: string;

  @Prop({ required: true })
  roomId!: string;

  @Prop({ required: true, default: [] })
  drawNumbers!: number[];

  @Prop({ default: [] })
  drawnNumbers!: number[];

  @Prop({ default: 0 })
  currentDrawIndex!: number;

  // Əvvəl düzəltdiyimiz sahə
  @Prop({ type: Number, default: null })
  currentNumber?: number | null;

  @Prop({ default: 'ongoing', enum: ['pending', 'ongoing', 'completed'] })
  status!: string;

  @Prop({ default: 0 })
  totalPool!: number;

  @Prop({ default: 0.08 })
  commissionRate!: number;

  @Prop({ default: 0 })
  commissionAmount!: number;

  @Prop({ default: 0 })
  payoutAmount!: number;

  @Prop()
  winnerId?: string;

  // Hazırkı xətanın səbəbi olan sahə (Düzəldilib)
  @Prop({ type: String, enum: ['real', 'bot'], default: null })
  winnerType?: 'real' | 'bot' | null;

  @Prop()
  winnerTicketId?: string;

  @Prop()
  startedAt!: Date;

  @Prop()
  completedAt?: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);
