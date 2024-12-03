import mongoose, { Schema, Document } from 'mongoose';
import { ITransaction } from '../interfaces/transaction.interface';
import { TransactionType } from '../enums/transaction.enum';


const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true }
);


export default mongoose.model<ITransaction>('Transaction', transactionSchema);
