import test from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';
import { JobAttentionType } from '../src/enums/job-attention.enum';
import JobAttention from '../src/models/job-attention.model';
import {
  createAttentionEvent,
  emptyAttentionSummary,
  getJobAttentionSummaries,
  markAttentionViewed,
} from '../src/services/job-attention.service';

const recipientId = new Types.ObjectId().toString();
const jobId = new Types.ObjectId().toString();
const eventId = new Types.ObjectId().toString();

test('empty attention does not require frontend animation', () => {
  assert.deepEqual(emptyAttentionSummary(), {
    requiresAttention: false,
    unviewedCount: 0,
    types: [],
    latestEventAt: null,
    eventIds: [],
  });
});

test('batched summaries return count, distinct types, latest time, and event IDs', async () => {
  const originalAggregate = JobAttention.aggregate;
  const latestEventAt = new Date('2026-10-23T08:30:00.000Z');
  (JobAttention as any).aggregate = async () => [{
    _id: new Types.ObjectId(jobId),
    unviewedCount: 2,
    types: [JobAttentionType.NEW_APPLICATION],
    latestEventAt,
    eventIds: [new Types.ObjectId(eventId)],
  }];
  try {
    const summaries = await getJobAttentionSummaries(recipientId, [jobId]);
    assert.deepEqual(summaries.get(jobId), {
      requiresAttention: true,
      unviewedCount: 2,
      types: [JobAttentionType.NEW_APPLICATION],
      latestEventAt,
      eventIds: [eventId],
    });
  } finally {
    (JobAttention as any).aggregate = originalAggregate;
  }
});

test('event creation is an idempotent upsert keyed by source and recipient', async () => {
  const originalFindOneAndUpdate = JobAttention.findOneAndUpdate;
  let captured: any[] = [];
  (JobAttention as any).findOneAndUpdate = async (...args: any[]) => {
    captured = args;
    return { _id: eventId };
  };
  try {
    await createAttentionEvent({
      jobId,
      applicationId: new Types.ObjectId().toString(),
      recipientId,
      actorId: new Types.ObjectId().toString(),
      type: JobAttentionType.NEW_APPLICATION,
      sourceId: new Types.ObjectId().toString(),
    });
    assert.equal(captured[2].upsert, true);
    assert.equal(captured[2].new, true);
    assert.equal(captured[0].recipientId, recipientId);
  } finally {
    (JobAttention as any).findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('snapshot acknowledgement only updates events at or before the loaded timestamp', async () => {
  const originalUpdateMany = JobAttention.updateMany;
  const originalAggregate = JobAttention.aggregate;
  const viewedThrough = new Date('2026-10-23T08:30:00.000Z');
  let updateFilter: any;
  (JobAttention as any).updateMany = async (filter: any) => {
    updateFilter = filter;
    return { modifiedCount: 1 };
  };
  (JobAttention as any).aggregate = async () => [];
  try {
    const summary = await markAttentionViewed({
      recipientId,
      jobId,
      type: JobAttentionType.NEW_APPLICATION,
      viewedThrough,
    });
    assert.deepEqual(updateFilter.createdAt, { $lte: viewedThrough });
    assert.equal(updateFilter.recipientId, recipientId);
    assert.equal(summary.requiresAttention, false);
  } finally {
    (JobAttention as any).updateMany = originalUpdateMany;
    (JobAttention as any).aggregate = originalAggregate;
  }
});

test('a user cannot acknowledge event IDs outside their recipient/context scope', async () => {
  const originalCountDocuments = JobAttention.countDocuments;
  (JobAttention as any).countDocuments = async () => 0;
  try {
    await assert.rejects(
      markAttentionViewed({
        recipientId,
        jobId,
        type: JobAttentionType.NEW_APPLICATION,
        eventIds: [eventId],
      }),
      /do not belong to this user or context/,
    );
  } finally {
    (JobAttention as any).countDocuments = originalCountDocuments;
  }
});
