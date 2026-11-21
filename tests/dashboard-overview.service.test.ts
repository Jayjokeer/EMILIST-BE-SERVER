import assert from "node:assert/strict";
import test from "node:test";
import { JobStatusEnum } from "../src/enums/jobs.enum";
import { dashboardPeriodRange, summarizeJobCompletion } from "../src/services/dashboard.service";

test("dashboard week range starts on Monday and ends at the supplied time", () => {
  const now = new Date("2026-11-21T09:42:15.000Z");
  const range = dashboardPeriodRange("week", now);
  assert.equal(range.startDate?.getFullYear(), 2026);
  assert.equal(range.startDate?.getMonth(), 10);
  assert.equal(range.startDate?.getDate(), 16);
  assert.equal(range.startDate?.getHours(), 0);
  assert.equal(range.endDate.toISOString(), now.toISOString());
  assert.equal(range.label, "This week");
});

test("job completion chart uses mutually exclusive buckets that total 100 percent", () => {
  const result = summarizeJobCompletion([
    JobStatusEnum.complete,
    JobStatusEnum.active,
    JobStatusEnum.pending,
    JobStatusEnum.overdue,
    JobStatusEnum.cancelled,
    JobStatusEnum.draft,
  ]);
  assert.deepEqual(result.counts, { completed: 1, pending: 2, overdue: 1, total: 4 });
  assert.deepEqual(result.percentages, { completed: 25, pending: 50, overdue: 25 });
  assert.equal(Object.values(result.percentages).reduce((sum, value) => sum + value, 0), 100);
});

test("all-time dashboard range has no lower date boundary", () => {
  const range = dashboardPeriodRange("all", new Date("2026-11-21T09:42:15.000Z"));
  assert.equal(range.startDate, null);
  assert.equal(range.label, "All time");
});
