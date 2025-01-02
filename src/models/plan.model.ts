import mongoose, { Schema, Document } from 'mongoose';
import { IPerk, IPlan } from '../interfaces/plans.interface';
import { SubscriptionPerksEnum } from '../enums/suscribtion.enum';
import { PlanEnum } from '../enums/plan.enum';


const PerkSchema = new Schema<IPerk>(
    {
      name: { type: String, enum: SubscriptionPerksEnum }, 
      limit: { type: Number, default: 0 }, 
      used: { type: Number, default: 0 }, 
    },
  );
  const OffersSchema = new Schema(
    {
      name: { type: String }, 
      value: { type: String }, 
      isActive: { type: Boolean, default: true }, 
    },
  );
const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, enum : PlanEnum },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, 
    perks: [PerkSchema],
    isActive: { type: Boolean, default: true },
    offers: [OffersSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IPlan>('Plan', PlanSchema);
