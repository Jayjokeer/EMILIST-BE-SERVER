import mongoose, { Document, Schema } from 'mongoose';
import { ProjectStatusEnum } from '../enums/project.enum';
import { IProject } from '../interfaces/project.interface';
const MilestoneSchema = new mongoose.Schema({
  milestoneId: { type: String, required: true },
  amount: { type: Number, required: true },
  achievement: { type: String, required: true },
});

const BiddableDetailsSchema = new mongoose.Schema({
  maximumPrice: { type: Number, required: true },
  milestones: { type: [MilestoneSchema], required: true },
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
      maximumPrice: { type: Number, required: true },
      milestones: [{
        milestoneId: { type: String, required: true },
        amount: { type: Number, required: true },
        achievement: { type: String, required: true },
      }],
    },
  
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', projectSchema);
