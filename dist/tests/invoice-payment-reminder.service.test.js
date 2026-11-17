"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const invoice_payment_reminder_service_1 = require("../src/services/invoice-payment-reminder.service");
const templates_1 = require("../src/utils/templates");
(0, node_test_1.default)("unpaid invoice becomes due again after 24 hours", () => {
    const now = new Date("2026-11-18T09:00:00.000Z");
    const milestone = {
        paymentStatus: "unpaid",
        invoice: {
            invoiceRaised: true,
            issuedAt: new Date("2026-11-16T09:00:00.000Z"),
            paymentReminderLastSentAt: new Date("2026-11-17T08:59:59.000Z"),
        },
    };
    strict_1.default.equal((0, invoice_payment_reminder_service_1.isInvoicePaymentReminderDue)(milestone, now), true);
});
(0, node_test_1.default)("paid and recently reminded invoices do not receive reminders", () => {
    const now = new Date("2026-11-18T09:00:00.000Z");
    strict_1.default.equal((0, invoice_payment_reminder_service_1.isInvoicePaymentReminderDue)({
        paymentStatus: "paid",
        invoice: { invoiceRaised: true },
    }, now), false);
    strict_1.default.equal((0, invoice_payment_reminder_service_1.isInvoicePaymentReminderDue)({
        paymentStatus: "unpaid",
        invoice: {
            invoiceRaised: true,
            paymentReminderLastSentAt: new Date("2026-11-18T08:00:00.000Z"),
        },
    }, now), false);
});
(0, node_test_1.default)("invoice reminder email never contains undefined values", () => {
    const email = (0, templates_1.invoicePaymentReminderEmail)(undefined, undefined);
    strict_1.default.doesNotMatch(`${email.subject} ${email.html}`, /\b(?:undefined|null|NaN)\b/i);
});
