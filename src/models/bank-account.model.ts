import mongoose, { Schema } from "mongoose";
import { IBankAccount } from "../interfaces/bank-account.interface";
import { WalletEnum } from "../enums/transaction.enum";

// User payout bank accounts. The Paystack transfer recipient is resolved once
// at add-time and reused for every withdrawal from any of the user's wallets.
const bankAccountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users", required: true, index: true },
    bankName: { type: String, required: true, trim: true },
    bankCode: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true, trim: true },
    recipientCode: { type: String, required: true },
    currency: { type: String, enum: WalletEnum, default: WalletEnum.NGN },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bankAccountSchema.index({ userId: 1, bankCode: 1, accountNumber: 1 }, { unique: true });

export default mongoose.model<IBankAccount>("BankAccount", bankAccountSchema);