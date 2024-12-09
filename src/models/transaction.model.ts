import mongoose, { Schema, Document } from 'mongoose';
import { ITransaction } from '../interfaces/transaction.interface';
import { PaymentMethodEnum, PaymentServiceEnum, TransactionEnum, TransactionType, WalletEnum } from '../enums/transaction.enum';


const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    type: { type: String, enum: TransactionType, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    balanceAfter: { type: Number, required: true },
    status: {type: String, enum: TransactionEnum, default: TransactionEnum.pending},
    recieverId: { type: Schema.Types.ObjectId, ref: 'Users', required: true},
    dateCompleted: {type: Date},
    productId: { type: Schema.Types.ObjectId, ref: 'Product'},
    quantity: {type: Number},
    jobId: {type: Schema.Types.ObjectId, ref: 'Jobs'},
    reference: { type: String },
    paymentMethod: { type: String, enum: PaymentMethodEnum, required: true },
    adminApproval: { type: Boolean, default: false },
    transferReceipt: {type: String, default: null},
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet'},
    paymentService: {type: String, enum: PaymentServiceEnum},
    currency: {type: String, enum: WalletEnum},
  },
  { timestamps: true }
);


export default mongoose.model<ITransaction>('Transaction', transactionSchema);
