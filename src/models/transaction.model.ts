import mongoose, { Schema, Document } from 'mongoose';
import { ITransaction } from '../interfaces/transaction.interface';
import { PaymentMethodEnum, PaymentServiceEnum, ServiceEnum, TransactionEnum, TransactionType, WalletEnum } from '../enums/transaction.enum';
import { SubscriptionPeriodEnum } from '../enums/suscribtion.enum';


const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    type: { type: String, enum: TransactionType, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    balanceAfter: { type: Number},
    balanceBefore: { type: Number },
    status: {type: String, enum: TransactionEnum, default: TransactionEnum.pending},
    recieverId: { type: Schema.Types.ObjectId, ref: 'Users'},
    dateCompleted: {type: Date},
    cartId: { type: Schema.Types.ObjectId, ref: 'Cart'},
    jobId: {type: Schema.Types.ObjectId, ref: 'Jobs'},
    milestoneId:{type: Schema.Types.ObjectId},
    reference: { type: String },
    paymentMethod: { type: String, enum: PaymentMethodEnum, required: true },
    adminApproval: { type: Boolean, default: false },
    transferReceipt: {type: String, default: null},
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet'},
    paymentService: {type: String, enum: PaymentServiceEnum},
    currency: {type: String, enum: WalletEnum},
    isSettled: { type: Boolean, default: false },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order'},
    serviceType: {type: String, enum: ServiceEnum},
    planId: { type: Schema.Types.ObjectId, ref: 'Plan'},
    vat: {type: Number},
    durationType: {type: String, enum: SubscriptionPeriodEnum}, 
  },
  { timestamps: true }
);


export default mongoose.model<ITransaction>('Transaction', transactionSchema);
