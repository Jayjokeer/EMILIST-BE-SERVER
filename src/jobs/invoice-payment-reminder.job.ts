import cron from "node-cron";
import { sendDueInvoicePaymentReminders } from "../services/invoice-payment-reminder.service";

cron.schedule("0 9 * * *", async () => {
  try {
    const sent = await sendDueInvoicePaymentReminders();
    console.log(`Sent ${sent} unpaid invoice payment reminder(s)`);
  } catch (error) {
    console.error("Invoice payment reminder job failed:", error);
  }
}, { timezone: "Africa/Lagos" });
