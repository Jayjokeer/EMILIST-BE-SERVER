import mongoose, { Document, Schema } from 'mongoose';
import { JobExpertLevel, JobPeriod, JobType } from '../enums/jobs.enum';
import { IJob, IMilestone } from '../interfaces/jobs.interface';

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
  });

const jobSchema: Schema = new mongoose.Schema(
  {
    category: { type: String},
    service: { type: String},
    title: { type: String },
    description: { type: String },
    jobFiles: [{ type: String }],
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
  },
  { timestamps: true }

);

export default mongoose.model<IJob>('Jobs', jobSchema);