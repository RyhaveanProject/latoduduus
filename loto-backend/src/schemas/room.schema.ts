import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type RoomDocument = Room & Document;

class BotProfile {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: true })
  isBot!: boolean;

  @Prop()
  avatar?: string;
}

@Schema({ timestamps: true })
export class Room {
  @Prop({ type: String, default: () => uuidv4() })
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

  @Prop({ type: [{ id: String, name: String, isBot: Boolean, avatar: String }], default: [] })
  botProfiles!: BotProfile[];

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

  @Prop({ default: 6 })
  maxPlayers!: number;

  @Prop({ default: 0 })
  currentPlayers!: number;

  @Prop({ default: 'waiting', enum: ['waiting', 'countdown', 'active', 'finished'] })
  status!: string;

  @Prop()
  currentGameId?: string;

  @Prop({ default: 0 })
  totalPrizePool!: number;

  @Prop({ default: false })
  requiresVerification!: boolean;

  @Prop({ default: false })
  isSystemRoom!: boolean;

  @Prop()
  botRosterUpdatedAt?: Date;

  @Prop()
  countdownStartedAt?: Date;

  @Prop()
  countdownEndsAt?: Date;

  @Prop()
  lastWinnerName?: string;

  @Prop()
  lastGameCompletedAt?: Date;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
