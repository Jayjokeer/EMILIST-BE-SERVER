import test from "node:test";
import assert from "node:assert/strict";
import { MilestoneEnum, MilestonePaymentStatus } from "../src/enums/jobs.enum";
import {
  CONTRACT_CLOSE_REMINDER_INTERVAL_MS,
  isContractCloseReminderDue,
} from "../src/services/contract-close-reminder.service";
import { contractCloseReminderEmail } from "../src/utils/templates";

const eligibleJob = (overrides: Record<string, unknown> = {}) => ({
  isClosed: false,
  milestones: [{
    status: MilestoneEnum.completed,
    paymentStatus: MilestonePaymentStatus.paid,
    invoice: { disputeStatus: "resolved" },
  }],
  ...overrides,
});

test("an eligible unclosed contract receives a close reminder", () => {
  assert.equal(isContractCloseReminderDue(eligibleJob()), true);
});

test("closed, unpaid, incomplete, and disputed contracts do not receive close reminders", () => {
  assert.equal(isContractCloseReminderDue(eligibleJob({ isClosed: true })), false);
  assert.equal(isContractCloseReminderDue(eligibleJob({
    milestones: [{ status: MilestoneEnum.completed, paymentStatus: MilestonePaymentStatus.unpaid }],
  })), false);
  assert.equal(isContractCloseReminderDue(eligibleJob({
    milestones: [{ status: MilestoneEnum.active, paymentStatus: MilestonePaymentStatus.paid }],
  })), false);
  assert.equal(isContractCloseReminderDue(eligibleJob({
    milestones: [{
      status: MilestoneEnum.completed,
      paymentStatus: MilestonePaymentStatus.paid,
      invoice: { disputeStatus: "open" },
    }],
  })), false);
});

test("contract close reminders are limited to once every 24 hours", () => {
  const now = new Date("2026-11-18T09:15:00.000Z");
  assert.equal(isContractCloseReminderDue(eligibleJob({
    contractCloseReminderLastSentAt: new Date(now.getTime() - CONTRACT_CLOSE_REMINDER_INTERVAL_MS + 1),
  }), now), false);
  assert.equal(isContractCloseReminderDue(eligibleJob({
    contractCloseReminderLastSentAt: new Date(now.getTime() - CONTRACT_CLOSE_REMINDER_INTERVAL_MS),
  }), now), true);
});

test("contract close reminder email has a safe actionable link", () => {
  const email = contractCloseReminderEmail(
    undefined as any,
    undefined as any,
    "https://emilist.example.com/?action=close-job-contract&jobId=job-1",
  );
  assert.doesNotMatch(`${email.subject} ${email.html}`, /\b(?:undefined|null|NaN)\b/i);
  assert.match(email.html, /action=close-job-contract/);
});
