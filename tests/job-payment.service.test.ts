import test from "node:test";
import assert from "node:assert/strict";
import { applySuccessfulJobPayment, reconcileProcessingJobPayment } from "../src/services/job-payment.service";

test("successful job payment completes the transaction and marks the invoice paid", () => {
  const milestoneId = "6ab584cbcff7d52841928b9a";
  const completedAt = new Date("2026-11-16T10:00:00.000Z");
  const job: any = {
    milestones: [{
      _id: milestoneId,
      paymentStatus: "processing",
      paymentInfo: {},
      invoice: { invoiceRaised: true, reviewStatus: "pending" },
    }],
  };
  const transaction: any = {
    milestoneId,
    amount: 25000,
    paymentMethod: "Card",
    status: "processing",
  };

  const result = applySuccessfulJobPayment(job, transaction, completedAt);

  assert.equal(result.milestone.paymentStatus, "paid");
  assert.equal(result.milestone.invoice.reviewStatus, "paid");
  assert.equal(result.milestone.paymentInfo.amountPaid, 25000);
  assert.equal(result.transaction.status, "completed");
  assert.equal(result.transaction.dateCompleted, completedAt);
});

test("successful job payment is idempotent for already-paid milestones", () => {
  const milestoneId = "6ab584cbcff7d52841928b9a";
  const paidAt = new Date("2026-11-16T09:00:00.000Z");
  const job: any = {
    milestones: [{
      _id: milestoneId,
      paymentStatus: "paid",
      datePaid: paidAt,
      paymentInfo: { amountPaid: 25000, paymentMethod: "Card", date: paidAt },
      invoice: { invoiceRaised: true, reviewStatus: "paid" },
    }],
  };
  const transaction: any = {
    milestoneId,
    amount: 25000,
    paymentMethod: "Card",
    status: "completed",
    dateCompleted: paidAt,
  };

  applySuccessfulJobPayment(job, transaction, new Date("2026-11-16T11:00:00.000Z"));

  assert.equal(job.milestones[0].datePaid, paidAt);
  assert.equal(transaction.dateCompleted, paidAt);
});

test("reconciles a successful legacy processing payment", async () => {
  const milestone: any = {
    _id: "milestone-1",
    paymentStatus: "processing",
    paymentInfo: {},
    invoice: { invoiceRaised: true, reviewStatus: "pending" },
  };
  const job: any = {
    milestones: [milestone],
    markModified() {},
    async save() { return this; },
  };
  const transaction: any = {
    milestoneId: milestone._id,
    jobId: "job-1",
    serviceType: "Job",
    paymentMethod: "Card",
    reference: "PS-SUCCESS",
    amount: 40_000,
    status: "processing",
    async save() { return this; },
  };

  const result = await reconcileProcessingJobPayment(job, milestone, transaction, async () => "success");

  assert.equal(result.outcome, "completed");
  assert.equal(transaction.status, "completed");
  assert.equal(milestone.paymentStatus, "paid");
  assert.equal(milestone.invoice.reviewStatus, "paid");
});

test("releases an unsuccessful legacy processing payment for retry", async () => {
  const milestone: any = {
    _id: "milestone-1",
    paymentStatus: "processing",
    paymentInfo: {},
    invoice: { invoiceRaised: true, reviewStatus: "pending" },
  };
  const job: any = {
    milestones: [milestone],
    markModified() {},
    async save() { return this; },
  };
  const transaction: any = {
    milestoneId: milestone._id,
    jobId: "job-1",
    serviceType: "Job",
    paymentMethod: "Card",
    reference: "PS-FAILED",
    amount: 40_000,
    status: "processing",
    async save() { return this; },
  };

  const result = await reconcileProcessingJobPayment(job, milestone, transaction, async () => "failed");

  assert.equal(result.outcome, "retry");
  assert.equal(transaction.status, "failed");
  assert.equal(milestone.paymentStatus, "unpaid");
});
