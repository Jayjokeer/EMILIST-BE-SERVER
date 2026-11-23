import test from "node:test";
import assert from "node:assert/strict";
import {
  invoiceDisputeMilestone,
  supportCards,
  supportPagination,
  supportStatusCounts,
  supportTrend,
} from "../src/services/support-request.service";
import { InvoiceDisputeType, SupportRequestStatus } from "../src/enums/support.enum";

test("support request pagination is bounded and deterministic", () => {
  assert.deepEqual(supportPagination(undefined, undefined), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(supportPagination("2", "20"), { page: 2, limit: 20, skip: 20 });
  assert.deepEqual(supportPagination("0", "1000"), { page: 1, limit: 100, skip: 0 });
});

test("admin support ticket counts include the global total", () => {
  assert.deepEqual(
    supportStatusCounts([
      { _id: SupportRequestStatus.open, count: 3 },
      { _id: SupportRequestStatus.inProgress, count: 2 },
      { _id: SupportRequestStatus.resolved, count: 5 },
    ], 1),
    {
      total: 10,
      open: 3,
      inProgress: 2,
      pendingCustomer: 0,
      pendingResolution: 0,
      resolved: 5,
      overdue: 1,
    },
  );
});

test("admin support cards expose display-ready values and trend metadata", () => {
  const cards = supportCards({
    ticketCount: 12,
    unassignedTickets: 3,
    highPriorityTickets: 2,
    overdueTickets: 1,
    pendingTickets: 4,
    averageResolution: { seconds: 3900, resolvedInPeriod: 5 },
    slaHours: 24,
  }, {
    total: { current: 6, previous: 4 },
    unassigned: { current: 1, previous: 2 },
    highPriority: { current: 2, previous: 2 },
    overdue: { current: 1, previous: 2 },
    pendingCustomer: { current: 4, previous: 2 },
    averageResolution: { current: 3900, previous: 5200 },
  });

  assert.equal(cards.totalTickets.value, 12);
  assert.equal(cards.totalTickets.trend.signedPercentage, 50);
  assert.equal(cards.unassignedTickets.trend.isImprovement, true);
  assert.equal(cards.averageResolutionTime.displayValue, "1h 5m");
  assert.equal(cards.averageResolutionTime.resolvedInPeriod, 5);
});

test("support trend handles an empty comparison period", () => {
  assert.deepEqual(supportTrend(0, 0), {
    percentage: 0,
    signedPercentage: 0,
    direction: "flat",
    isImprovement: null,
    comparison: "previous_7_days",
    currentPeriodValue: 0,
    previousPeriodValue: 0,
  });
  assert.equal(supportTrend(3, 0).signedPercentage, 100);
});

test("invoice dispute resolves the exact raised invoice for the job owner", () => {
  const job: any = {
    userId: "6a21f270d23c3015a245cc84",
    milestones: [{
      _id: "6ab584cbcff7d52841928b9a",
      invoice: { invoiceRaised: true, invoiceId: "6ab584cbcff7d52841928b9b" },
    }],
  };
  const result = invoiceDisputeMilestone(
    job,
    "6a21f270d23c3015a245cc84",
    "6ab584cbcff7d52841928b9a",
    "6ab584cbcff7d52841928b9b",
  );
  assert.equal(String(result.milestone._id), "6ab584cbcff7d52841928b9a");
  assert.equal(result.raisedByRole, "job_owner");
});

test("invoice dispute rejects a requester who is not the job owner", () => {
  const job: any = { userId: "owner", milestones: [] };
  assert.throws(
    () => invoiceDisputeMilestone(job, "another-user", "milestone"),
    /Only the job owner or accepted artisan/,
  );
});

test("job owner can dispute unsatisfactory work after an invoice was paid", () => {
  const job: any = {
    userId: "owner",
    milestones: [{
      _id: "milestone",
      paymentStatus: "paid",
      invoice: { invoiceRaised: true, invoiceId: "invoice" },
    }],
  };
  const result = invoiceDisputeMilestone(
    job, "owner", "milestone", "invoice", InvoiceDisputeType.ownerUnsatisfiedWork,
  );
  assert.equal(result.raisedByRole, "job_owner");
});

test("artisan can dispute an unpaid additional cost after the original amount was paid", () => {
  const job: any = {
    userId: "owner",
    milestones: [{
      _id: "milestone",
      amount: 5000,
      paymentStatus: "paid",
      paymentInfo: { amountPaid: 5000 },
      invoice: { invoiceRaised: true, invoiceId: "invoice", additionalAmount: 1000 },
    }],
  };
  const result = invoiceDisputeMilestone(
    job, "artisan", "milestone", "invoice",
    InvoiceDisputeType.artisanAdditionalCostUnpaid, "artisan",
  );
  assert.equal(result.raisedByRole, "artisan");
});

test("artisan can dispute an invoice unpaid beyond the seven-day grace period", () => {
  const now = new Date("2026-11-17T12:00:00.000Z");
  const job: any = {
    userId: "owner",
    milestones: [{
      _id: "milestone",
      paymentStatus: "unpaid",
      invoice: { invoiceRaised: true, invoiceId: "invoice", issuedAt: "2026-11-09T12:00:00.000Z" },
    }],
  };
  const result = invoiceDisputeMilestone(
    job, "artisan", "milestone", "invoice",
    InvoiceDisputeType.artisanInvoiceUnpaidOverdue, "artisan", now,
  );
  assert.equal(result.raisedByRole, "artisan");
});
