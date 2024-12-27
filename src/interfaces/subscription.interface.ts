import { Schema } from "mongoose";
import { IPerk } from "./plans.interface";

export interface ISubscription extends Document {
    userId: Schema.Types.ObjectId;
    planId: Schema.Types.ObjectId;
    status: string; 
    startDate: Date;
    endDate: Date;
    perks : IPerk[];
  }