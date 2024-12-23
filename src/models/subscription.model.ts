import mongoose, { Schema, Document } from 'mongoose';
import { SubscriptionStatusEnum } from '../enums/suscribtion.enum';
import { ISubscription } from '../interfaces/subscription.interface';



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
  },
  { timestamps: true }
);

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
