import mongoose from "mongoose";
import { PaymentMethodEnum, PaymentServiceEnum, ServiceEnum, TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import { SubscriptionPeriodEnum } from "../enums/suscribtion.enum";

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
    walletId?: any;
    balanceBefore: number;
    cartId?: any; 
    jobId?: any;
    milestoneId?: any;
    orderId: any;
    serviceType: ServiceEnum;
    planId: any;
    recieverId?: mongoose.Schema.Types.ObjectId;
    vat?: number;
    createdAt: Date;
    durationType?: SubscriptionPeriodEnum;
    isSettled: boolean;
    verificationId?: any;
  };
  