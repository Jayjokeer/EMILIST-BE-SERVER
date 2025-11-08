import mongoose, { Schema, Document } from 'mongoose';
import { SubscriptionPeriodEnum, SubscriptionPerksEnum, SubscriptionStatusEnum } from '../enums/suscribtion.enum';
import { ISubscription } from '../interfaces/subscription.interface';
import { IPerk } from '../interfaces/plans.interface';


const PerkSchema = new Schema<IPerk>(
    {
      name: { type: String, enum: SubscriptionPerksEnum }, 
      limit: { type: Number, default: 0 }, 
      used: { type: Number, default: 0 }, 
    },
  );


const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    status: {
      type: String,
      enum: SubscriptionStatusEnum,
      default: SubscriptionStatusEnum.active,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date},
    perks: [PerkSchema],
    subscriptionPeriod: { type: String, enum: SubscriptionPeriodEnum },
  },
  { timestamps: true }
);

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
