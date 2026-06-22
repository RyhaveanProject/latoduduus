import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type RoomDocument = Room & Document;

@Schema({ timestamps: true })
export class Room {
  @Prop({
    type: String,
    default: () => uuidv4(),
  })
  _id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: 'public', enum: ['public', 'private'] })
  visibility!: string;

  @Prop()
  roomCode?: string;

  @Prop({ required: true })
  ownerId!: string;

  @Prop({ default: [] })
  players!: string[];

  @Prop({ default: [] })
  spectators!: string[];

  @Prop({ default: [] })
  messages!: Array<{
    userId: string;
    username: string;
    message: string;
    timestamp: Date;
  }>;

  @Prop({ default: 100 })
  entryFee!: number;

  @Prop({ default: 10 })
  maxPlayers!: number;

  @Prop({ default: 0 })
  currentPlayers!: number;

  @Prop({ default: 'waiting', enum: ['waiting', 'active', 'finished'] })
  status!: string;

  @Prop()
  currentGameId?: string;

  @Prop({ default: 0 })
  totalPrizePool!: number;

  @Prop({ default: false })
  requiresVerification!: boolean;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
