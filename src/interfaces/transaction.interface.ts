import mongoose from "mongoose";
import { TransactionType } from "../enums/transaction.enum";

export interface ITransaction extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    type: TransactionType;
    amount: number;
    description: string;
    balanceAfter: number;
  }
  