import test from 'node:test';
import assert from 'node:assert/strict';
import { formatJobAnalyticsResponse } from '../src/services/job.service';

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
    periods: [],
  });
});
