import test from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';
import Target from '../src/models/target.model';
import Jobs from '../src/models/jobs.model';
import ReportEvent from '../src/models/report-event.model';
import { recordResourceReportEvent } from '../src/services/report-event.service';
import { buildUserReportCsv, resolveReportRange, upsertUserTarget } from '../src/services/user-report.service';

test('monthly report range uses the complete UTC calendar month', () => {
  const range = resolveReportRange({ year: 2026, month: 4 });
  assert.equal(range.startDate.toISOString(), '2026-04-01T00:00:00.000Z');
  assert.equal(range.endDate.toISOString(), '2026-04-30T23:59:59.999Z');
  assert.equal(range.month, 4);
});

test('last 30 days includes today and exactly 29 preceding days', () => {
  const range = resolveReportRange(
    { range: 'last30days' },
    new Date('2026-04-30T12:00:00.000Z'),
  );
  assert.equal(range.startDate.toISOString(), '2026-04-01T00:00:00.000Z');
  assert.equal(range.endDate.toISOString(), '2026-04-30T23:59:59.999Z');
});

test('invalid and oversized report ranges are rejected', () => {
  assert.throws(() => resolveReportRange({ year: 2026, month: 13 }), /Month must be between/);
  assert.throws(() => resolveReportRange({ startDate: '2026-02-30', endDate: '2026-03-01' }), /valid calendar date/);
  assert.throws(
    () => resolveReportRange({ startDate: '2025-01-01', endDate: '2026-12-31' }),
    /cannot exceed 366 days/,
  );
});

test('target save upserts the selected period rather than creating duplicates', async () => {
  const originalFindOneAndUpdate = Target.findOneAndUpdate;
  let filter: any;
  let update: any;
  (Target as any).findOneAndUpdate = async (query: any, value: any) => {
    filter = query;
    update = value;
    return { _id: new Types.ObjectId(), ...value.$set };
  };

  try {
    const result: any = await upsertUserTarget(new Types.ObjectId().toString(), {
      duration: 'monthly', year: 2026, month: 4, currency: 'NGN',
      job: 2, amount: 150000, referrals: 15, invites: 24,
    });
    assert.equal(filter.duration, 'monthly');
    assert.equal(filter.year, 2026);
    assert.equal(filter.month, 4);
    assert.equal(update.$set.amount, 150000);
    assert.equal(result.invites, 24);
  } finally {
    Target.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('CSV export includes every designed report section', () => {
  const report: any = {
    filters: { startDate: new Date('2026-04-01'), endDate: new Date('2026-04-30'), currency: 'NGN' },
    jobs: { total: 1, active: 1 },
    applications: { applicants: { total: 2 }, myApplications: { total: 3 } },
    finance: { earnings: { total: 100, categories: { jobs: 100 } }, expenses: { total: 20, categories: { materials: 20 } } },
    trade: { orders: { total: 1 }, sales: { total: 2 } },
    insights: { overview: { clicks: 4 }, promotionDuration: { totalDays: 30 }, clicks: { total: 4 }, targets: { goals: { jobs: 2 }, actual: { jobs: 1 }, progress: { overall: 50 } } },
  };
  const csv = buildUserReportCsv(report);
  for (const section of ['Jobs', 'Applications - Applicants', 'Applications - Mine', 'Earnings', 'Expenses', 'Orders', 'Sales', 'Insights', 'Promotion Duration', 'Click Performance', 'Targets - Goals', 'Targets - Actual', 'Targets - Progress']) {
    assert.match(csv, new RegExp(section));
  }
});

test('report events resolve the listing owner on the backend', async () => {
  const originalFindById = Jobs.findById;
  const originalCreate = ReportEvent.create;
  const ownerId = new Types.ObjectId();
  const actorId = new Types.ObjectId();
  const jobId = new Types.ObjectId();
  let created: any;

  (Jobs as any).findById = () => ({
    select: () => ({ lean: async () => ({ _id: jobId, userId: ownerId }) }),
  });
  (ReportEvent as any).create = async (value: any) => {
    created = value;
    return { _id: new Types.ObjectId(), ...value };
  };

  try {
    await recordResourceReportEvent({
      actorUserId: actorId.toString(),
      type: 'impression',
      resourceType: 'job',
      resourceId: jobId.toString(),
    });
    assert.equal(String(created.subjectUserId), ownerId.toString());
    assert.equal(String(created.actorUserId), actorId.toString());
    assert.equal(created.type, 'impression');
  } finally {
    Jobs.findById = originalFindById;
    ReportEvent.create = originalCreate;
  }
});
