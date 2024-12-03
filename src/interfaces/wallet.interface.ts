import mongoose, { Schema, Document } from 'mongoose';

export interface IWallet extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  balance: number;
  currency: string;
}