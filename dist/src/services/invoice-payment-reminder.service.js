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
exports.sendDueInvoicePaymentReminders = exports.sendInvoicePaymentReminder = exports.isInvoicePaymentReminderDue = void 0;
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const jobs_enum_1 = require("../enums/jobs.enum");
const notification_enum_1 = require("../enums/notification.enum");
const notificationService = __importStar(require("./notification.service"));
const send_email_1 = require("../utils/send_email");
const templates_1 = require("../utils/templates");
const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;
const isInvoicePaymentReminderDue = (milestone, now = new Date()) => {
    if (!milestone?.invoice?.invoiceRaised)
        return false;
    if (milestone.paymentStatus === jobs_enum_1.MilestonePaymentStatus.paid)
        return false;
    if (milestone.invoice.disputeStatus === "open")
        return false;
    const previous = milestone.invoice.paymentReminderLastSentAt || milestone.invoice.issuedAt;
    if (!previous)
        return true;
    return now.getTime() - new Date(previous).getTime() >= REMINDER_INTERVAL_MS;
};
exports.isInvoicePaymentReminderDue = isInvoicePaymentReminderDue;
const sendInvoicePaymentReminder = async (job, milestone, owner, initial = false) => {
    const jobId = String(job._id);
    const milestoneId = String(milestone._id);
    const invoiceId = milestone.invoice?.invoiceId ? String(milestone.invoice.invoiceId) : null;
    const jobTitle = job.title || "your job";
    await notificationService.createNotification({
        userId: owner._id || job.userId,
        title: initial ? "Invoice ready for payment" : "Invoice payment reminder",
        message: initial
            ? `An invoice has been raised for ${jobTitle}. Review it and complete payment.`
            : `The invoice for ${jobTitle} is still unpaid. Review it and complete payment.`,
        type: notification_enum_1.NotificationTypeEnum.job,
        level: notification_enum_1.NotificationLevelEnum.alert,
        resourceId: jobId,
        action: "pay_job_invoice",
        metadata: { jobId, milestoneId, invoiceId },
    });
    if (owner.email) {
        const { subject, html } = (0, templates_1.invoicePaymentReminderEmail)(owner.fullName || owner.userName || owner.firstName, jobTitle, initial);
        try {
            await (0, send_email_1.sendEmail)(owner.email, subject, html);
        }
        catch (error) {
            // The in-app notification has already been delivered. Email delivery is
            // best-effort and must not roll back an invoice or duplicate reminders.
            console.error("Invoice payment reminder email failed:", error);
        }
    }
};
exports.sendInvoicePaymentReminder = sendInvoicePaymentReminder;
const sendDueInvoicePaymentReminders = async (now = new Date()) => {
    const cutoff = new Date(now.getTime() - REMINDER_INTERVAL_MS);
    const jobs = await jobs_model_1.default.find({
        milestones: {
            $elemMatch: {
                "invoice.invoiceRaised": true,
                "invoice.disputeStatus": { $ne: "open" },
                paymentStatus: { $ne: jobs_enum_1.MilestonePaymentStatus.paid },
                $or: [
                    { "invoice.paymentReminderLastSentAt": { $lte: cutoff } },
                    {
                        "invoice.paymentReminderLastSentAt": { $exists: false },
                        $or: [
                            { "invoice.issuedAt": { $lte: cutoff } },
                            { "invoice.issuedAt": { $exists: false } },
                        ],
                    },
                ],
            },
        },
    }).populate("userId", "firstName lastName fullName userName email");
    let sent = 0;
    for (const job of jobs) {
        const owner = job.userId;
        if (!owner)
            continue;
        for (const milestone of job.milestones || []) {
            if (!(0, exports.isInvoicePaymentReminderDue)(milestone, now))
                continue;
            const claim = await jobs_model_1.default.updateOne({
                _id: job._id,
                milestones: {
                    $elemMatch: {
                        _id: milestone._id,
                        "invoice.invoiceRaised": true,
                        "invoice.disputeStatus": { $ne: "open" },
                        paymentStatus: { $ne: jobs_enum_1.MilestonePaymentStatus.paid },
                        $or: [
                            { "invoice.paymentReminderLastSentAt": { $lte: cutoff } },
                            {
                                "invoice.paymentReminderLastSentAt": { $exists: false },
                                $or: [
                                    { "invoice.issuedAt": { $lte: cutoff } },
                                    { "invoice.issuedAt": { $exists: false } },
                                ],
                            },
                        ],
                    },
                },
            }, {
                $set: { "milestones.$.invoice.paymentReminderLastSentAt": now },
                $inc: { "milestones.$.invoice.paymentReminderCount": 1 },
            });
            if (claim.modifiedCount !== 1)
                continue;
            await (0, exports.sendInvoicePaymentReminder)(job, milestone, owner);
            sent += 1;
        }
    }
    return sent;
};
exports.sendDueInvoicePaymentReminders = sendDueInvoicePaymentReminders;
