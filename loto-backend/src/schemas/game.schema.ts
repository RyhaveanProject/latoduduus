import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type GameDocument = Game & Document;

@Schema({ timestamps: true })
export class Game {
  @Prop({
    type: String,
    default: () => uuidv4(),
  })
  _id!: string;

  @Prop({ required: true })
  roomId!: string;

  @Prop({ required: true })
  drawNumbers!: number[];

  @Prop({ default: [] })
  stage1Winners!: string[];

  @Prop({ default: [] })
  stage2Winners!: string[];

  @Prop({ default: [] })
  stage3Winners!: string[];

  @Prop({ default: 'ongoing', enum: ['ongoing', 'stage1', 'stage2', 'completed'] })
  status!: string;

  @Prop({ default: null })
  stage1Prize?: number;

  @Prop({ default: null })
  stage2Prize?: number;

  @Prop({ default: null })
  stage3Prize?: number;

  @Prop({ default: 0 })
  totalPool!: number;

  @Prop()
  startedAt!: Date;

  @Prop()
  completedAt?: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);
