"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDueContractCloseReminders = exports.sendContractCloseReminder = exports.isContractCloseReminderDue = exports.CONTRACT_CLOSE_REMINDER_INTERVAL_MS = void 0;
const jobs_enum_1 = require("../enums/jobs.enum");
const notification_enum_1 = require("../enums/notification.enum");
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const config_1 = require("../utils/config");
const frontend_url_1 = require("../utils/frontend-url");
const send_email_1 = require("../utils/send_email");
const templates_1 = require("../utils/templates");
const notificationService = __importStar(require("./notification.service"));
exports.CONTRACT_CLOSE_REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;
const isContractCloseReminderDue = (job, now = new Date()) => {
    const milestones = Array.isArray(job?.milestones) ? job.milestones : [];
    if (job?.isClosed || milestones.length === 0)
        return false;
    if (milestones.some((milestone) => milestone.status !== jobs_enum_1.MilestoneEnum.completed))
        return false;
    if (milestones.some((milestone) => milestone.paymentStatus !== jobs_enum_1.MilestonePaymentStatus.paid))
        return false;
    if (milestones.some((milestone) => milestone.invoice?.disputeStatus === "open"))
        return false;
    const lastSentAt = job.contractCloseReminderLastSentAt;
    if (!lastSentAt)
        return true;
    return now.getTime() - new Date(lastSentAt).getTime() >= exports.CONTRACT_CLOSE_REMINDER_INTERVAL_MS;
};
exports.isContractCloseReminderDue = isContractCloseReminderDue;
const eligibleContractQuery = () => ({
    isClosed: { $ne: true },
    "milestones.0": { $exists: true },
    $nor: [
        { milestones: { $elemMatch: { status: { $ne: jobs_enum_1.MilestoneEnum.completed } } } },
        { milestones: { $elemMatch: { paymentStatus: { $ne: jobs_enum_1.MilestonePaymentStatus.paid } } } },
        { milestones: { $elemMatch: { "invoice.disputeStatus": "open" } } },
    ],
});
const sendContractCloseReminder = async (job, owner) => {
    const jobId = String(job._id);
    const jobTitle = job.title || "your completed job";
    const ownerName = owner.fullName
        || [owner.firstName, owner.lastName].filter(Boolean).join(" ")
        || owner.userName
        || owner.email?.split("@")[0]
        || "there";
    await notificationService.createNotification({
        userId: owner._id || job.userId,
        title: "Close completed contract",
        message: `All milestones for ${jobTitle} are completed and paid. Review the work and close the contract.`,
        type: notification_enum_1.NotificationTypeEnum.job,
        level: notification_enum_1.NotificationLevelEnum.alert,
        resourceId: jobId,
        action: "close_job_contract",
        metadata: { jobId },
    });
    if (!owner.email)
        return;
    const closeContractUrl = (0, frontend_url_1.buildFrontendUrl)(config_1.config.frontendUrl, {
        query: { action: "close-job-contract", jobId },
    });
    const { subject, html } = (0, templates_1.contractCloseReminderEmail)(ownerName, jobTitle, closeContractUrl);
    try {
        await (0, send_email_1.sendEmail)(owner.email, subject, html);
    }
    catch (error) {
        console.error("Contract close reminder email failed:", error);
    }
};
exports.sendContractCloseReminder = sendContractCloseReminder;
const sendDueContractCloseReminders = async (now = new Date()) => {
    const cutoff = new Date(now.getTime() - exports.CONTRACT_CLOSE_REMINDER_INTERVAL_MS);
    const reminderWindow = {
        $or: [
            { contractCloseReminderLastSentAt: { $lte: cutoff } },
            { contractCloseReminderLastSentAt: { $exists: false } },
        ],
    };
    const jobs = await jobs_model_1.default.find({
        ...eligibleContractQuery(),
        ...reminderWindow,
    }).populate("userId", "firstName lastName userName email");
    let sent = 0;
    for (const job of jobs) {
        const owner = job.userId;
        if (!owner || !(0, exports.isContractCloseReminderDue)(job, now))
            continue;
        const claim = await jobs_model_1.default.updateOne({
            _id: job._id,
            ...eligibleContractQuery(),
            ...reminderWindow,
        }, {
            $set: { contractCloseReminderLastSentAt: now },
            $inc: { contractCloseReminderCount: 1 },
        });
        if (claim.modifiedCount !== 1)
            continue;
        await (0, exports.sendContractCloseReminder)(job, owner);
        sent += 1;
    }
    return sent;
};
exports.sendDueContractCloseReminders = sendDueContractCloseReminders;
