import mongoose, { Schema, Document } from 'mongoose';

interface IPlan extends Document {
  name: string;
  price: number;
  duration: number; 
  perks: string[]; 
  isActive: boolean;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, 
    perks: [{ type: String, required: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPlan>('Plan', PlanSchema);
