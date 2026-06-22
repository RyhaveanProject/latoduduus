import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    default: () => uuidv4(),
  })
  _id: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop()
  password?: string;

  @Prop({ trim: true })
  firstName?: string;

  @Prop({ trim: true })
  lastName?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: 'user', enum: ['user', 'admin', 'moderator'] })
  role: string;

  @Prop({ default: 'en', enum: ['en', 'az', 'ru', 'tr'] })
  language: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  googleId?: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  country?: string;

  @Prop()
  city?: string;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop()
  bannedReason?: string;

  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop()
  twoFactorSecret?: string;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: 0 })
  totalDeposited: number;

  @Prop({ default: 0 })
  totalWithdrawn: number;

  @Prop({ default: 0 })
  totalWinnings: number;

  @Prop({ default: 0 })
  gamesPlayed: number;

  @Prop({ default: 0 })
  gamesWon: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// FIX: Köhnə username_1 index-ini MongoDB-dən silmək üçün
// Əgər production MongoDB-də bu index hələ də varsa, aşağıdakı
// migration-u bir dəfə işə salın:
//   db.users.dropIndex("username_1")
// Bu schema-da username field-i yoxdur, ona görə bu index
// avtomatik yaranmayacaq. Lakin köhnə index varsa onu əl ilə silmək lazımdır.
