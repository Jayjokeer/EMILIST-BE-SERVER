import mongoose, { Document, Schema } from 'mongoose';
import { JobExpertLevel, JobPeriod, JobType, MilestoneEnum, MilestonePaymentStatus, JobStatusEnum  } from '../enums/jobs.enum';
import { IJob, IMilestone } from '../interfaces/jobs.interface';
import { date } from 'joi';

const MilestoneSchema = new Schema<IMilestone>({
    timeFrame: {
      number: {type: String},
      period: {type: String},
    },
    achievement: {
      type: String,
    },
    amount: {
      type: Number,
    },
    status:{
      type: String,
      enum: MilestoneEnum,
      default: MilestoneEnum.pending
    },
    paymentStatus: {
      type: String,
      enum: MilestonePaymentStatus,
      default:  MilestonePaymentStatus.unpaid,
    },
    paymentReciept: {type: String },
    accountDetails: {
      bank: {type: String},
      accountNumber: {type: String},
      accountName: {type: String}
    },
  });
const jobSchema: Schema = new mongoose.Schema(
  {
    category: { type: String},
    service: { type: String},
    title: { type: String },
    description: { type: String },
    jobFiles:[
      {
        id: { type: Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
        url: { type: String },
      }
    ],
    duration: {
         number: {type: Number},
         period: {type: String, enum: JobPeriod},
        },
    type: {type: String, enum: JobType},
    budget: {type: Number},
    location: {type: String},
    expertLevel: {type: String, enum: JobExpertLevel},
    milestones: {
        type: [MilestoneSchema],
        validate: {
          validator: (value: IMilestone[]) => value.length <= 5,
          message: 'Cannot have more than 5 milestones.',
        },
      },
    maximumPrice: {type: Number},
    bidRange: {type: Number},
    achievementDetails: {type: String},
    currency: {type: String},
    status: {
      type: String,
      enum: JobStatusEnum,
      default: JobStatusEnum.pending, 
    },
    userId: {type: Schema.Types.ObjectId, ref: 'Users'},
    applications: [ {type: Schema.Types.ObjectId, ref: 'Project'}  ],
    acceptedApplicationId: {type: Schema.Types.ObjectId, ref: 'Project'},
    additionalAmount: {type: Number},
    startDate: { type: Date }, 
    isRequestForQuote: {type: Boolean, default: false },
    pausedDate: {type: Date},
  },
  { timestamps: true }

);
export default mongoose.model<IJob>('Jobs', jobSchema);