import cron from "node-cron";
import { sendDueContractCloseReminders } from "../services/contract-close-reminder.service";

cron.schedule("15 9 * * *", async () => {
  try {
    const sent = await sendDueContractCloseReminders();
    console.log(`Sent ${sent} contract close reminder(s)`);
  } catch (error) {
    console.error("Contract close reminder job failed:", error);
  }
}, { timezone: "Africa/Lagos" });
