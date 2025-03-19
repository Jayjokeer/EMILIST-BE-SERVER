import { Document, Types } from 'mongoose';
import { ProjectStatusEnum } from '../enums/project.enum';

// interface Milestone {
//     milestoneId: string;
//     amount: number;
//     achievement: string;
//   }
  
//   interface BiddableDetails {
//     maximumPrice: number;
//     milestones: Milestone[];
//   }
  
  export interface IProject extends Document {
    job: any;
    user: string;
    creator: string;
    status?: ProjectStatusEnum;
    appliedAt?: Date;
    acceptedAt?: Date;
    rejectedAt?: Date;
    biddableDetails?: any;
    directJobStatus?: ProjectStatusEnum;
    quote?: any 
    businessId?: string;
  }
  