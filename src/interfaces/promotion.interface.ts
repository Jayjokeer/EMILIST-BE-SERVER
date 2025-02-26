import mongoose from "mongoose";

export interface IPromotion extends mongoose.Document {
    jobId: mongoose.Types.ObjectId;
    businessId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    target: string;
    startDate: Date;
    endDate: Date;
    cost: number;
    clicks: number;
    costPerClick: number;
    isActive: boolean;
    paymentStatus: 'pending' | 'paid';
    createdAt: Date;
  }
  