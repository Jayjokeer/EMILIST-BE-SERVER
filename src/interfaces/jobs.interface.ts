import mongoose from "mongoose";
import { FrequencyEnum, JobExpertLevel, JobPeriod, JobStatusEnum, JobType, MilestoneEnum, MilestonePaymentStatus, QuoteStatusEnum, JobUrgencyEnum, JobFrequencyEnum, DurationUnitEnum, ExperienceLevelEnum } from "../enums/jobs.enum";

// ===================== NEW SUB-TYPES FOR REWORK =====================

export interface ILocation {
  address: string;
  lat?: number;
  lng?: number;
}

export interface IJobSchedule {
  startDate: Date;
  endDate?: Date;
}

export interface IBudget {
  currency: string;
  amount: number;
}

export interface IRecurringBudget extends IBudget {
  period: JobFrequencyEnum;
}

export interface IJobDuration {
  value: number;
  unit: DurationUnitEnum;
}

// ===================== EXISTING INTERFACES (RETAINED) =====================

export interface IJob {
    category: string;
    service: string;
    title: string;
    description: string;
    jobFiles: any;
    duration: any;
    type: JobType;
    budget?: number;
    location: any;  // backward-compat: old records have string, new have object ILocation
    expertLevel: any;  // backward-compat: old JobExpertLevel or new ExperienceLevelEnum
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
    endDate?: Date;
    pausedDate?: Date;
    email?: string; 
    userName?: string; 
    isRequestForQuote?: boolean; 
    isClosed?: boolean;
    review?: any;
    createdAt?: any;
    clicks?: any;

    // ===== NEW FIELDS FOR REWORK =====
    jobUrgency?: JobUrgencyEnum;
    jobCategory?: string;        // alias for category
    allowBidding?: boolean;
    experienceLevel?: ExperienceLevelEnum;
    expertId?: string;           // Business uniqueId for direct hire to an expert
    isDirectHire?: boolean;      // Flag indicating this job was directly assigned to an expert

    // Urgency-specific nested objects (all optional, gated by jobUrgency)
    jobFrequency?: JobFrequencyEnum;
    recurringBudget?: IRecurringBudget;

    jobSchedule?: IJobSchedule;
    estimatedBudget?: IBudget;

    jobDuration?: IJobDuration;
    totalBudget?: IBudget;
}

export interface IMilestone {
    timeFrame: any;
    achievement: string;
    amount: number;
    currency?: string;
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
    location?: any;
    expertLevel?: any;
    milestones?: IMilestone[];
    maximumPrice?: number;
    bidRange?: number;
    budget?: number;
    achievementDetails?: string;
    currency?: string;
    status?: JobStatusEnum;
    startDate?: Date;
    endDate?: Date;

    // ===== NEW FIELDS FOR REWORK =====
    jobUrgency?: JobUrgencyEnum;
    jobCategory?: string;
    images?: string[];
    allowBidding?: boolean;
    experienceLevel?: ExperienceLevelEnum;
    expertId?: string;
    isDirectHire?: boolean;
    jobFrequency?: JobFrequencyEnum;
    recurringBudget?: IRecurringBudget;
    jobSchedule?: IJobSchedule;
    estimatedBudget?: IBudget;
    jobDuration?: IJobDuration;
    totalBudget?: IBudget;
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