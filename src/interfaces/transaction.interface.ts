import mongoose from "mongoose";
import { PaymentMethodEnum, PaymentServiceEnum, TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";

export interface ITransaction extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    type: TransactionType;
    amount: number;
    description: string;
    balanceAfter: number;
    dateCompleted: Date;
    paymentMethod: PaymentMethodEnum;
    status: TransactionEnum;
    adminApproval: boolean;
    reference: string;
    transferReceipt?: string;
    paymentService?: PaymentServiceEnum;
    currency: WalletEnum;
    walletId: any;
    balanceBefore: number;
  };
  