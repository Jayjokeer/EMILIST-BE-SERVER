"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const contract_close_reminder_service_1 = require("../services/contract-close-reminder.service");
node_cron_1.default.schedule("15 9 * * *", async () => {
    try {
        const sent = await (0, contract_close_reminder_service_1.sendDueContractCloseReminders)();
        console.log(`Sent ${sent} contract close reminder(s)`);
    }
    catch (error) {
        console.error("Contract close reminder job failed:", error);
    }
}, { timezone: "Africa/Lagos" });
