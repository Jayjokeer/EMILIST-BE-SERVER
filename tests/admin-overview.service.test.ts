import test from "node:test";
import assert from "node:assert/strict";
import { overviewRange, percentageChange } from "../src/services/admin-overview.service";

test("overview range defaults to 30 days and returns adjacent comparison windows", () => {
  const now = new Date("2026-11-04T12:00:00.000Z");
  const range = overviewRange(undefined, now);

  assert.equal(range.range, "30d");
  assert.equal(range.days, 30);
  assert.equal(range.currentEnd.toISOString(), now.toISOString());
  assert.equal(range.currentStart.toISOString(), "2026-10-05T12:00:00.000Z");
  assert.equal(range.previousEnd.toISOString(), range.currentStart.toISOString());
  assert.equal(range.previousStart.toISOString(), "2026-09-05T12:00:00.000Z");
});

test("overview range accepts supported values and falls back for unknown values", () => {
  const now = new Date("2026-11-04T12:00:00.000Z");

  assert.equal(overviewRange("7D", now).days, 7);
  assert.equal(overviewRange("90d", now).days, 90);
  assert.equal(overviewRange("12m", now).days, 365);
  assert.equal(overviewRange("all", now).range, "30d");
});

test("percentage change handles growth, decline, rounding, and zero baselines", () => {
  assert.equal(percentageChange(125, 100), 25);
  assert.equal(percentageChange(75, 100), -25);
  assert.equal(percentageChange(1, 3), -66.67);
  assert.equal(percentageChange(10, 0), 100);
  assert.equal(percentageChange(0, 0), 0);
});
