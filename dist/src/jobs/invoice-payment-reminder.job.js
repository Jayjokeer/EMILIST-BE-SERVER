"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const invoice_payment_reminder_service_1 = require("../services/invoice-payment-reminder.service");
node_cron_1.default.schedule("0 9 * * *", async () => {
    try {
        const sent = await (0, invoice_payment_reminder_service_1.sendDueInvoicePaymentReminders)();
        console.log(`Sent ${sent} unpaid invoice payment reminder(s)`);
    }
    catch (error) {
        console.error("Invoice payment reminder job failed:", error);
    }
}, { timezone: "Africa/Lagos" });
