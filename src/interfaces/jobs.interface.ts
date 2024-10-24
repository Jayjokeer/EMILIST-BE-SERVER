import { JobExpertLevel, JobStatusEnum, JobType, MilestoneEnum, MilestonePaymentStatus } from "../enums/jobs.enum";

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
}

export interface IMilestone {
    timeFrame: any; 
    achievement: string; 
    amount: number; 
    status: MilestoneEnum;
    paymentStatus: MilestonePaymentStatus;
  }

