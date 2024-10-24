import mongoose, { Document, Schema } from 'mongoose';
import { ProjectStatusEnum } from '../enums/project.enum';
import { IProject } from '../interfaces/project.interface';

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
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', projectSchema);
