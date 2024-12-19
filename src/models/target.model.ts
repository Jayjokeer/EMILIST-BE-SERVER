import mongoose, { Document, Schema } from 'mongoose';
import { ITarget } from '../interfaces/target.interface';
import { TargetEnum } from '../enums/target.enum';
import { WalletEnum } from '../enums/transaction.enum';


  const targetSchema: Schema = new mongoose.Schema(
    {
      duration: { type: String, enum: TargetEnum },
      userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
      job: {type: Number, default: 0},
      invites: {type: Number, default: 0},
      referrals: {type: Number, default: 0},
      amount: {type: Number, default: 0},
      currency: {type: String, enum: WalletEnum}
    },
    { timestamps: true }
  );
  
  export default mongoose.model<ITarget>("Target", targetSchema);