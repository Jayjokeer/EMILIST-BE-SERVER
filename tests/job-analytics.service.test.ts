import test from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';
import Jobs from '../src/models/jobs.model';
import Project from '../src/models/project.model';
import { JobStatusEnum, MilestoneEnum } from '../src/enums/jobs.enum';
import { ProjectStatusEnum } from '../src/enums/project.enum';
import {
  activateAcceptedApplication,
  calculateJobDueDate,
  formatJobAnalyticsResponse,
  jobAnalytics,
  summarizeJobAnalyticsPeriod,
} from '../src/services/job.service';

test('job analytics returns one object with totals and the period breakdown', () => {
  const periods = [
    {
      period: 'Jan 2026',
      totalJobs: 3,
      totalActiveJobs: 1,
      totalOverdueJobs: 0,
      totalPausedJobs: 0,
      totalCompletedJobs: 1,
      totalPendingJobs: 1,
    },
    {
      period: 'Feb 2026',
      totalJobs: 4,
      totalActiveJobs: 2,
      totalOverdueJobs: 1,
      totalPausedJobs: 0,
      totalCompletedJobs: 1,
      totalPendingJobs: 0,
    },
  ];

  assert.deepEqual(formatJobAnalyticsResponse(periods), {
    totalJobs: 7,
    totalActiveJobs: 3,
    totalOverdueJobs: 1,
    totalPausedJobs: 0,
    totalCompletedJobs: 2,
    totalPendingJobs: 1,
    totalDraftJobs: 0,
    totalListedJobs: 0,
    totalInReviewJobs: 0,
    totalCancelledJobs: 0,
    periods,
  });
});

test('job analytics returns an empty object summary when there are no periods', () => {
  assert.deepEqual(formatJobAnalyticsResponse([]), {
    totalJobs: 0,
    totalActiveJobs: 0,
    totalOverdueJobs: 0,
    totalPausedJobs: 0,
    totalCompletedJobs: 0,
    totalPendingJobs: 0,
    totalDraftJobs: 0,
    totalListedJobs: 0,
    totalInReviewJobs: 0,
    totalCancelledJobs: 0,
    periods: [],
  });
});

test('accepted artisan assignments are counted as active jobs', async () => {
  const originalProjectFind = Project.find;
  const originalJobsFind = Jobs.find;
  const artisanId = new Types.ObjectId();
  const ownerId = new Types.ObjectId();
  const projectOne = new Types.ObjectId();
  const projectTwo = new Types.ObjectId();
  const acceptedAt = new Date('2026-04-10T10:00:00.000Z');

  (Project as any).find = () => ({
    select: () => ({
      lean: async () => [
        { _id: projectOne, status: ProjectStatusEnum.accepted, acceptedAt, updatedAt: acceptedAt },
        { _id: projectTwo, status: ProjectStatusEnum.accepted, acceptedAt, updatedAt: acceptedAt },
      ],
    }),
  });
  (Jobs as any).find = () => ({
    lean: async () => [
      { _id: new Types.ObjectId(), userId: ownerId, status: JobStatusEnum.active, acceptedApplicationId: projectOne, acceptedAt, milestones: [] },
      { _id: new Types.ObjectId(), userId: ownerId, status: JobStatusEnum.active, acceptedApplicationId: projectTwo, acceptedAt, milestones: [] },
    ],
  });

  try {
    const result: any = await jobAnalytics(2026, undefined, undefined, undefined, artisanId.toString());
    assert.equal(result.totalJobs, 2);
    assert.equal(result.totalActiveJobs, 2);
    assert.equal(result.scope.assignedJobs, 2);
    assert.equal(result.scope.ownedJobs, 0);
  } finally {
    Project.find = originalProjectFind;
    Jobs.find = originalJobsFind;
  }
});

test('all job views use the same duration-aware overdue calculation', () => {
  const dueDate = calculateJobDueDate({
    acceptedAt: new Date('2026-01-01T00:00:00.000Z'),
    milestones: [
      { timeFrame: { number: '1', period: 'weeks' } },
      { timeFrame: { number: '2', period: 'days' } },
    ],
  });
  assert.equal(dueDate?.toISOString(), '2026-01-10T00:00:00.000Z');

  const summary = summarizeJobAnalyticsPeriod([
    {
      relationship: 'assigned',
      relationshipDate: new Date('2026-01-01T00:00:00.000Z'),
      job: {
        status: JobStatusEnum.active,
        acceptedAt: new Date('2026-01-01T00:00:00.000Z'),
        milestones: [{ timeFrame: { number: '1', period: 'days' } }],
      },
    },
  ], 'Jan 2026', new Date('2026-01-03T00:00:00.000Z'));
  assert.equal(summary.totalOverdueJobs, 1);
  assert.equal(summary.totalActiveJobs, 0);
});

test('all acceptance paths apply the same assignment invariants', () => {
  const applicationId = new Types.ObjectId();
  const acceptedAt = new Date('2026-04-10T10:00:00.000Z');
  const job: any = {
    status: JobStatusEnum.listed,
    milestones: [{ status: MilestoneEnum.pending }, { status: MilestoneEnum.pending }],
  };
  const project: any = { _id: applicationId, status: ProjectStatusEnum.applied };

  activateAcceptedApplication(job, project, acceptedAt);

  assert.equal(job.status, JobStatusEnum.active);
  assert.equal(String(job.acceptedApplicationId), String(applicationId));
  assert.equal(job.acceptedAt, acceptedAt);
  assert.equal(project.status, ProjectStatusEnum.accepted);
  assert.equal(project.acceptedAt, acceptedAt);
  assert.equal(job.milestones[0].status, MilestoneEnum.active);
  assert.equal(job.milestones[1].status, MilestoneEnum.pending);
});
