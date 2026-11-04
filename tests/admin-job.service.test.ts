import test from "node:test";
import assert from "node:assert/strict";
import { JobStatusEnum } from "../src/enums/jobs.enum";
import { adminJobActionsForStatus, adminJobPagination, jobDisplayStatus } from "../src/services/admin-job.service";

test("admin job pagination applies safe defaults and limits", () => {
  assert.deepEqual(adminJobPagination(undefined, undefined), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(adminJobPagination("3", "25"), { page: 3, limit: 25, skip: 50 });
  assert.deepEqual(adminJobPagination("-1", "999"), { page: 1, limit: 100, skip: 0 });
});

test("an unlisted legacy listed job is presented as a draft", () => {
  assert.equal(jobDisplayStatus({ status: JobStatusEnum.listed, isListed: false }), JobStatusEnum.draft);
  assert.equal(jobDisplayStatus({ status: JobStatusEnum.active, isListed: true }), JobStatusEnum.active);
});

test("job actions follow the state-management design", () => {
  assert.deepEqual(adminJobActionsForStatus(JobStatusEnum.draft), ["remove_listing"]);
  assert.deepEqual(adminJobActionsForStatus(JobStatusEnum.listed), ["approve_listing", "reject_listing"]);
  assert.deepEqual(adminJobActionsForStatus(JobStatusEnum.in_review), ["remove_listing"]);
  assert.deepEqual(adminJobActionsForStatus(JobStatusEnum.active), ["pause"]);
  assert.deepEqual(adminJobActionsForStatus(JobStatusEnum.paused), ["resume"]);
  assert.deepEqual(adminJobActionsForStatus(JobStatusEnum.overdue), ["cancel"]);
  assert.deepEqual(adminJobActionsForStatus(JobStatusEnum.complete), ["convert_to_recurring"]);
});
