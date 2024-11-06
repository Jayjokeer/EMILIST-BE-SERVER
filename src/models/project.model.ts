import mongoose, { Document, Schema } from 'mongoose';
import { ProjectStatusEnum, QuoteStatusEnum } from '../enums/project.enum';
import { IProject } from '../interfaces/project.interface';
const MilestoneSchema = new mongoose.Schema({
  milestoneId: { type: String, required: true },
  amount: { type: Number, required: true },
  achievement: { type: String, required: true },
});

const QuoteSchema = new mongoose.Schema({
  totalAmount: {type: Number},
  milestones: { type: [MilestoneSchema] },
  status: {type: String,enum: QuoteStatusEnum, default: QuoteStatusEnum.pending }
});

const projectSchema: Schema = new mongoose.Schema(
  {
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Jobs',  
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'Users',  
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'Users',  
      required: true,
    },
    status: {
      type: String,
      enum: ProjectStatusEnum,
      default: ProjectStatusEnum.pending, 
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    directJobStatus: {
      type: String,
      enum: ProjectStatusEnum,
    },
    biddableDetails: {
      maximumPrice: { type: Number },
      milestones: [{
        milestoneId: { type: String },
        amount: { type: Number},
        achievement: { type: String },
      }],
    },
    quote: {
      type: QuoteSchema,
    }

  
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', projectSchema);
