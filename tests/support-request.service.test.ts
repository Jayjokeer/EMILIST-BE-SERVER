import test from "node:test";
import assert from "node:assert/strict";
import { invoiceDisputeMilestone, supportPagination } from "../src/services/support-request.service";

test("support request pagination is bounded and deterministic", () => {
  assert.deepEqual(supportPagination(undefined, undefined), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(supportPagination("2", "20"), { page: 2, limit: 20, skip: 20 });
  assert.deepEqual(supportPagination("0", "1000"), { page: 1, limit: 100, skip: 0 });
});

test("invoice dispute resolves the exact raised invoice for the job owner", () => {
  const job: any = {
    userId: "6a21f270d23c3015a245cc84",
    milestones: [{
      _id: "6ab584cbcff7d52841928b9a",
      invoice: { invoiceRaised: true, invoiceId: "6ab584cbcff7d52841928b9b" },
    }],
  };
  const milestone = invoiceDisputeMilestone(
    job,
    "6a21f270d23c3015a245cc84",
    "6ab584cbcff7d52841928b9a",
    "6ab584cbcff7d52841928b9b",
  );
  assert.equal(String(milestone._id), "6ab584cbcff7d52841928b9a");
});

test("invoice dispute rejects a requester who is not the job owner", () => {
  const job: any = { userId: "owner", milestones: [] };
  assert.throws(
    () => invoiceDisputeMilestone(job, "another-user", "milestone"),
    /Only the job owner/,
  );
});

test("invoice dispute rejects an invoice that has already been paid", () => {
  const job: any = {
    userId: "owner",
    milestones: [{
      _id: "milestone",
      paymentStatus: "paid",
      invoice: { invoiceRaised: true, invoiceId: "invoice" },
    }],
  };
  assert.throws(
    () => invoiceDisputeMilestone(job, "owner", "milestone", "invoice"),
    /paid invoice cannot be disputed/i,
  );
});
