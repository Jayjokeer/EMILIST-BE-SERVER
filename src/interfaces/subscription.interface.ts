import { Schema } from "mongoose";

export interface ISubscription extends Document {
    userId: Schema.Types.ObjectId;
    planId: Schema.Types.ObjectId;
    status: string; 
    startDate: Date;
    endDate: Date;
  }