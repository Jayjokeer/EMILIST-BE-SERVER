import mongoose, { Document } from "mongoose";

export interface IBankAccount extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  recipientCode: string;
  currency: string;
  isDefault: boolean;
}