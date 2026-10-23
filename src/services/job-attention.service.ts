import { Types } from 'mongoose';
import { JobAttentionType } from '../enums/job-attention.enum';
import { BadRequestError } from '../errors/error';
import JobAttention from '../models/job-attention.model';

export interface AttentionSummary {
  requiresAttention: boolean;
  unviewedCount: number;
  types: JobAttentionType[];
  latestEventAt: Date | null;
  eventIds: string[];
}

export const emptyAttentionSummary = (): AttentionSummary => ({
  requiresAttention: false,
  unviewedCount: 0,
  types: [],
  latestEventAt: null,
  eventIds: [],
});

export const createAttentionEvent = async (data: {
  jobId: string;
  applicationId?: string;
  recipientId: string;
  actorId: string;
  type: JobAttentionType;
  sourceId: string;
}) => JobAttention.findOneAndUpdate(
  { type: data.type, sourceId: data.sourceId, recipientId: data.recipientId },
  { $setOnInsert: data },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

const buildSummaryMap = async (
  recipientId: string,
  field: 'jobId' | 'applicationId',
  ids: string[],
) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return new Map<string, AttentionSummary>();

  const summaries = await JobAttention.aggregate([
    {
      $match: {
        recipientId: new Types.ObjectId(recipientId),
        viewedAt: null,
        [field]: { $in: uniqueIds.map(id => new Types.ObjectId(id)) },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: `$${field}`,
        unviewedCount: { $sum: 1 },
        types: { $addToSet: '$type' },
        latestEventAt: { $max: '$createdAt' },
        eventIds: { $push: '$_id' },
      },
    },
  ]);

  return new Map<string, AttentionSummary>(summaries.map((summary: any) => [
    String(summary._id),
    {
      requiresAttention: summary.unviewedCount > 0,
      unviewedCount: summary.unviewedCount,
      types: summary.types,
      latestEventAt: summary.latestEventAt,
      eventIds: summary.eventIds.map(String),
    },
  ]));
};

export const getJobAttentionSummaries = (recipientId: string, jobIds: string[]) =>
  buildSummaryMap(recipientId, 'jobId', jobIds);

export const getApplicationAttentionSummaries = (recipientId: string, applicationIds: string[]) =>
  buildSummaryMap(recipientId, 'applicationId', applicationIds);

const validateViewSelection = async (
  recipientId: string,
  context: { jobId?: string; applicationId?: string; type: JobAttentionType },
  eventIds?: string[],
) => {
  if (!eventIds?.length) return;
  const uniqueEventIds = [...new Set(eventIds)];
  if (uniqueEventIds.some(id => !Types.ObjectId.isValid(id))) {
    throw new BadRequestError('One or more attention event IDs are invalid.');
  }
  const count = await JobAttention.countDocuments({
    _id: { $in: uniqueEventIds },
    recipientId,
    type: context.type,
    ...(context.jobId ? { jobId: context.jobId } : {}),
    ...(context.applicationId ? { applicationId: context.applicationId } : {}),
  });
  if (count !== uniqueEventIds.length) {
    throw new BadRequestError('One or more attention events do not belong to this user or context.');
  }
};

export const markAttentionViewed = async (data: {
  recipientId: string;
  jobId?: string;
  applicationId?: string;
  type: JobAttentionType;
  eventIds?: string[];
  viewedThrough?: Date;
}) => {
  if (!data.eventIds?.length && !data.viewedThrough) {
    throw new BadRequestError('Provide eventIds or viewedThrough from the attention response.');
  }

  await validateViewSelection(data.recipientId, data, data.eventIds);
  const selection = data.eventIds?.length
    ? { _id: { $in: [...new Set(data.eventIds)] } }
    : { createdAt: { $lte: data.viewedThrough } };

  await JobAttention.updateMany(
    {
      recipientId: data.recipientId,
      viewedAt: null,
      type: data.type,
      ...(data.jobId ? { jobId: data.jobId } : {}),
      ...(data.applicationId ? { applicationId: data.applicationId } : {}),
      ...selection,
    },
    { $set: { viewedAt: new Date() } },
  );

  const map = data.applicationId
    ? await getApplicationAttentionSummaries(data.recipientId, [data.applicationId])
    : await getJobAttentionSummaries(data.recipientId, [data.jobId!]);
  return map.get(String(data.applicationId || data.jobId)) || emptyAttentionSummary();
};
