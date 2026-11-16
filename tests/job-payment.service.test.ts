import test from "node:test";
import assert from "node:assert/strict";
import { applySuccessfulJobPayment } from "../src/services/job-payment.service";

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
