import mongoose, { Schema } from 'mongoose';
import { IPromotion } from '../interfaces/promotion.interface';


const PromotionSchema = new Schema<IPromotion>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Jobs', },
  businessId: { type: Schema.Types.ObjectId, ref: 'Business' },
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  target: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  cost: { type: Number, required: true },
  clicks: { type: Number, default: 0 },
  costPerClick: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPromotion>('Promotion', PromotionSchema);
