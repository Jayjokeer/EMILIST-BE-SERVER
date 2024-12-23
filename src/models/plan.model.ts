import mongoose, { Schema, Document } from 'mongoose';
import { IPerk, IPlan } from '../interfaces/plans.interface';
import { SubscriptionPerksEnum } from '../enums/suscribtion.enum';


const PerkSchema = new Schema<IPerk>(
    {
      name: { type: String, enum: SubscriptionPerksEnum }, 
      limit: { type: Number, default: 0 }, 
      used: { type: Number, default: 0 }, 
    },
  );

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, 
    perks: [PerkSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPlan>('Plan', PlanSchema);
