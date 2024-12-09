import mongoose, { Schema, Document } from 'mongoose';
import { IWallet } from '../interfaces/wallet.interface';
import { WalletEnum } from '../enums/transaction.enum';


const walletSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: WalletEnum.NGN },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);
walletSchema.index({ userId: 1, currency: 1 }, { unique: true });

export default mongoose.model<IWallet>('Wallet', walletSchema);