import mongoose from "mongoose";
import { FrequencyEnum, JobExpertLevel, JobPeriod, JobStatusEnum, JobType, MilestoneEnum, MilestonePaymentStatus, QuoteStatusEnum } from "../enums/jobs.enum";

export interface IJob {
    category: string;
    service: string;
    title: string;
    description: string;
    jobFiles: any;
    duration: any;
    type: JobType;
    budget?: number;
    location: string;
    expertLevel: JobExpertLevel;
    milestones: any;
    maximumPrice?: number;
    bidRange?: number;
    achievementDetails: string;
    currency: string;
    status: JobStatusEnum;
    userId: string;
    applications?: string[];
    acceptedApplicationId?: any;
    startDate?: Date;
    pausedDate?: Date;
    email?: string; 
    userName?: string; 
    isRequestForQuote?: boolean; 
    isClosed?: boolean;
    review?: any;
    createdAt?: any;
    clicks?: any;
}

export interface IMilestone {
    timeFrame: any; 
    achievement: string; 
    amount: number; 
    status: MilestoneEnum;
    paymentStatus: MilestonePaymentStatus;
    paymentReciept: string;
    paymentInfo: any;
    datePaid: Date;
    invoice: any;
  }


export interface IUpdateJob {
    category?: string;
    service?: string;
    title?: string;
    description?: string;
    jobFiles?: string[];
    duration?: {
      number?: number;
      period?: JobPeriod;
    };
    type?: JobType;
    location?: string;
    expertLevel?: JobExpertLevel;
    milestones?: IMilestone[];
    maximumPrice?: number;
    bidRange?: number;
    budget?: number;
    achievementDetails?: string;
    currency?: string;
    status?: JobStatusEnum;
  }
  
  export interface IQuote {
    milestoneId: string; 
    achievement: string; 
    amount: number; 
    status: QuoteStatusEnum;
  }

  export interface IRecurringJob {
    jobId: mongoose.Types.ObjectId;            
    frequency: FrequencyEnum;    
    startDate: Date;                              
    endDate: Date;                                
    nextMaintenanceDate: Date;                    
    reminderDates: any;                        
    childJobs: mongoose.Types.ObjectId[];        
  }
  