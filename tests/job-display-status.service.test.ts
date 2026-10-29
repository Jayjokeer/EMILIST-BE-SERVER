import test from 'node:test';
import assert from 'node:assert/strict';
import { JobStatusEnum } from '../src/enums/jobs.enum';
import { ProjectStatusEnum } from '../src/enums/project.enum';
import { resolveJobDisplayStatus } from '../src/services/job.service';

test('an accepted job is active from the artisan perspective', () => {
  const artisanId = 'artisan-1';
  const job = {
    userId: 'owner-1',
    status: JobStatusEnum.active,
    applications: [{ user: artisanId, status: ProjectStatusEnum.accepted }],
  };

  assert.equal(resolveJobDisplayStatus(job, artisanId), JobStatusEnum.active);
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
