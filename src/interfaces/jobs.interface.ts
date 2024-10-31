import { JobExpertLevel, JobPeriod, JobStatusEnum, JobType, MilestoneEnum, MilestonePaymentStatus } from "../enums/jobs.enum";

export interface IJob {
    category: string;
    service: string;
    title: string;
    description: string;
    jobFiles: string[];
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
    uniqueId?: string;
    acceptedApplicantId?: string;
    startDate?: Date;
}

export interface IMilestone {
    timeFrame: any; 
    achievement: string; 
    amount: number; 
    status: MilestoneEnum;
    paymentStatus: MilestonePaymentStatus;
    paymentReciept: string;
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
  
