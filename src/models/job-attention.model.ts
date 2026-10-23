import mongoose, { Schema } from 'mongoose';
import { JobAttentionType } from '../enums/job-attention.enum';

const jobAttentionSchema = new mongoose.Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Jobs', required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Project' },
    recipientId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
    type: { type: String, enum: JobAttentionType, required: true },
    viewedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    sourceId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);

jobAttentionSchema.index({ recipientId: 1, viewedAt: 1, jobId: 1, createdAt: -1 });
jobAttentionSchema.index({ recipientId: 1, viewedAt: 1, applicationId: 1, createdAt: -1 });
jobAttentionSchema.index({ type: 1, sourceId: 1, recipientId: 1 }, { unique: true });

export default mongoose.model('JobAttention', jobAttentionSchema);
