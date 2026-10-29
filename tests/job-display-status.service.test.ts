import test from 'node:test';
import assert from 'node:assert/strict';
import { JobStatusEnum } from '../src/enums/jobs.enum';
import { ProjectStatusEnum } from '../src/enums/project.enum';
import { buildVisibleJobsQuery, resolveJobDisplayStatus } from '../src/services/job.service';

test('status endpoint includes jobs owned by or assigned to the artisan', () => {
  assert.deepEqual(buildVisibleJobsQuery('artisan-1', ['application-1']), {
    $or: [
      { userId: 'artisan-1' },
      { acceptedApplicationId: { $in: ['application-1'] } },
    ],
  });
});

test('an accepted job is active from the artisan perspective', () => {
  const artisanId = 'artisan-1';
  const job = {
    userId: 'owner-1',
    status: JobStatusEnum.active,
    applications: [{ user: artisanId, status: ProjectStatusEnum.accepted }],
  };

  assert.equal(resolveJobDisplayStatus(job, artisanId), JobStatusEnum.active);
});

test('an accepted application follows the job lifecycle after activation', () => {
  const artisanId = 'artisan-1';
  const application = {
    _id: 'application-1',
    user: artisanId,
    status: ProjectStatusEnum.accepted,
  };

  assert.equal(resolveJobDisplayStatus({
    userId: 'owner-1',
    acceptedApplicationId: application._id,
    status: JobStatusEnum.paused,
    applications: [application],
  }, artisanId), JobStatusEnum.paused);

  assert.equal(resolveJobDisplayStatus({
    userId: 'owner-1',
    acceptedApplicationId: application._id,
    status: JobStatusEnum.complete,
    applications: [application],
  }, artisanId), JobStatusEnum.complete);
});

test('application-only states remain visible to the artisan', () => {
  const artisanId = 'artisan-1';
  const job = {
    userId: 'owner-1',
    status: JobStatusEnum.listed,
    applications: [{ user: artisanId, status: ProjectStatusEnum.rejected }],
  };

  assert.equal(resolveJobDisplayStatus(job, artisanId), ProjectStatusEnum.rejected);
});
