import mongoose, { Schema, Document } from 'mongoose';
import { SubscriptionStatusEnum } from '../enums/suscribtion.enum';

interface ISubscription extends Document {
  userId: Schema.Types.ObjectId;
  planId: Schema.Types.ObjectId;
  status: string; 
  startDate: Date;
  endDate: Date;
  perks: string[]; 
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    status: {
      type: String,
      enum: SubscriptionStatusEnum,
      default: SubscriptionStatusEnum.active,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    perks: [{ type: String, required: true }],
  },
  { timestamps: true }
);

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
