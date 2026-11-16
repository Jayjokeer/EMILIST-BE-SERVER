import test from "node:test";
import assert from "node:assert/strict";
import { isInvoicePaymentReminderDue } from "../src/services/invoice-payment-reminder.service";
import { invoicePaymentReminderEmail } from "../src/utils/templates";

test("unpaid invoice becomes due again after 24 hours", () => {
  const now = new Date("2026-11-18T09:00:00.000Z");
  const milestone = {
    paymentStatus: "unpaid",
    invoice: {
      invoiceRaised: true,
      issuedAt: new Date("2026-11-16T09:00:00.000Z"),
      paymentReminderLastSentAt: new Date("2026-11-17T08:59:59.000Z"),
    },
  };
  assert.equal(isInvoicePaymentReminderDue(milestone, now), true);
});

test("paid and recently reminded invoices do not receive reminders", () => {
  const now = new Date("2026-11-18T09:00:00.000Z");
  assert.equal(isInvoicePaymentReminderDue({
    paymentStatus: "paid",
    invoice: { invoiceRaised: true },
  }, now), false);
  assert.equal(isInvoicePaymentReminderDue({
    paymentStatus: "unpaid",
    invoice: {
      invoiceRaised: true,
      paymentReminderLastSentAt: new Date("2026-11-18T08:00:00.000Z"),
    },
  }, now), false);
});

test("invoice reminder email never contains undefined values", () => {
  const email = invoicePaymentReminderEmail(undefined as any, undefined as any);
  assert.doesNotMatch(`${email.subject} ${email.html}`, /\b(?:undefined|null|NaN)\b/i);
});
