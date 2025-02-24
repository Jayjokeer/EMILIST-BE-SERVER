import { Schema } from "mongoose";
import { IOffers, IPerk } from "./plans.interface";

export interface ISubscription extends Document {
    userId: Schema.Types.ObjectId;
    planId: any;
    status: string; 
    startDate: Date;
    endDate: Date;
    perks : IPerk[];
    subscriptionPeriod: string;
  }