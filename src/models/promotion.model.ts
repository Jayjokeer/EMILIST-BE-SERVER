import mongoose, { Schema } from 'mongoose';
import { IPromotion } from '../interfaces/promotion.interface';
import { PromotionPaymentStatus, PromotionTargetEnum } from '../enums/suscribtion.enum';


const PromotionSchema = new Schema<IPromotion>({
  jobId: { type: Schema.Types.ObjectId, ref: 'Jobs', },
  businessId: { type: Schema.Types.ObjectId, ref: 'Business' },
  userId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  target: { type: String,enum: PromotionTargetEnum, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  cost: { type: Number, required: true },
  clicks: { type: Number, default: 0 },
  costPerClick: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  paymentStatus: { type: String, enum: PromotionPaymentStatus, default: PromotionPaymentStatus.pending },
},
{
  timestamps: true
});

export default mongoose.model<IPromotion>('Promotion', PromotionSchema);
