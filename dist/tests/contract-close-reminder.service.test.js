"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const jobs_enum_1 = require("../src/enums/jobs.enum");
const contract_close_reminder_service_1 = require("../src/services/contract-close-reminder.service");
const templates_1 = require("../src/utils/templates");
const eligibleJob = (overrides = {}) => ({
    isClosed: false,
    milestones: [{
            status: jobs_enum_1.MilestoneEnum.completed,
            paymentStatus: jobs_enum_1.MilestonePaymentStatus.paid,
            invoice: { disputeStatus: "resolved" },
        }],
    ...overrides,
});
(0, node_test_1.default)("an eligible unclosed contract receives a close reminder", () => {
    strict_1.default.equal((0, contract_close_reminder_service_1.isContractCloseReminderDue)(eligibleJob()), true);
});
(0, node_test_1.default)("closed, unpaid, incomplete, and disputed contracts do not receive close reminders", () => {
    strict_1.default.equal((0, contract_close_reminder_service_1.isContractCloseReminderDue)(eligibleJob({ isClosed: true })), false);
    strict_1.default.equal((0, contract_close_reminder_service_1.isContractCloseReminderDue)(eligibleJob({
        milestones: [{ status: jobs_enum_1.MilestoneEnum.completed, paymentStatus: jobs_enum_1.MilestonePaymentStatus.unpaid }],
    })), false);
    strict_1.default.equal((0, contract_close_reminder_service_1.isContractCloseReminderDue)(eligibleJob({
        milestones: [{ status: jobs_enum_1.MilestoneEnum.active, paymentStatus: jobs_enum_1.MilestonePaymentStatus.paid }],
    })), false);
    strict_1.default.equal((0, contract_close_reminder_service_1.isContractCloseReminderDue)(eligibleJob({
        milestones: [{
                status: jobs_enum_1.MilestoneEnum.completed,
                paymentStatus: jobs_enum_1.MilestonePaymentStatus.paid,
                invoice: { disputeStatus: "open" },
            }],
    })), false);
});
(0, node_test_1.default)("contract close reminders are limited to once every 24 hours", () => {
    const now = new Date("2026-11-18T09:15:00.000Z");
    strict_1.default.equal((0, contract_close_reminder_service_1.isContractCloseReminderDue)(eligibleJob({
        contractCloseReminderLastSentAt: new Date(now.getTime() - contract_close_reminder_service_1.CONTRACT_CLOSE_REMINDER_INTERVAL_MS + 1),
    }), now), false);
    strict_1.default.equal((0, contract_close_reminder_service_1.isContractCloseReminderDue)(eligibleJob({
        contractCloseReminderLastSentAt: new Date(now.getTime() - contract_close_reminder_service_1.CONTRACT_CLOSE_REMINDER_INTERVAL_MS),
    }), now), true);
});
(0, node_test_1.default)("contract close reminder email has a safe actionable link", () => {
    const email = (0, templates_1.contractCloseReminderEmail)(undefined, undefined, "https://emilist.example.com/?action=close-job-contract&jobId=job-1");
    strict_1.default.doesNotMatch(`${email.subject} ${email.html}`, /\b(?:undefined|null|NaN)\b/i);
    strict_1.default.match(email.html, /action=close-job-contract/);
});
