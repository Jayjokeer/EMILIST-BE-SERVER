import mongoose, { Schema, Document } from 'mongoose';
import { ITransaction } from '../interfaces/transaction.interface';
import { TransactionEnum, TransactionType } from '../enums/transaction.enum';


const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    balanceAfter: { type: Number, required: true },
    status: {type: String, enum: TransactionEnum, default: TransactionEnum.pending},
    recieverId: { type: Schema.Types.ObjectId, ref: 'Users', required: true},
    dateCompleted: {type: Date},
    productId: { type: Schema.Types.ObjectId, ref: 'Product'},
    quantity: {type: Number},
    jobId: {type: Schema.Types.ObjectId, ref: 'Jobs'}
  },
  { timestamps: true }
);


export default mongoose.model<ITransaction>('Transaction', transactionSchema);
