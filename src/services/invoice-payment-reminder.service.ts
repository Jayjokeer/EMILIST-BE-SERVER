import Jobs from "../models/jobs.model";
import { MilestonePaymentStatus } from "../enums/jobs.enum";
import { NotificationLevelEnum, NotificationTypeEnum } from "../enums/notification.enum";
import * as notificationService from "./notification.service";
import { sendEmail } from "../utils/send_email";
import { invoicePaymentReminderEmail } from "../utils/templates";

const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const isInvoicePaymentReminderDue = (milestone: any, now = new Date()) => {
  if (!milestone?.invoice?.invoiceRaised) return false;
  if (milestone.paymentStatus === MilestonePaymentStatus.paid) return false;
  const previous = milestone.invoice.paymentReminderLastSentAt || milestone.invoice.issuedAt;
  if (!previous) return true;
  return now.getTime() - new Date(previous).getTime() >= REMINDER_INTERVAL_MS;
};

export const sendInvoicePaymentReminder = async (
  job: any,
  milestone: any,
  owner: any,
  initial = false,
) => {
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
    type: NotificationTypeEnum.job,
    level: NotificationLevelEnum.alert,
    resourceId: jobId,
    action: "pay_job_invoice",
    metadata: { jobId, milestoneId, invoiceId },
  });

  if (owner.email) {
    const { subject, html } = invoicePaymentReminderEmail(
      owner.fullName || owner.userName || owner.firstName,
      jobTitle,
      initial,
    );
    try {
      await sendEmail(owner.email, subject, html);
    } catch (error) {
      // The in-app notification has already been delivered. Email delivery is
      // best-effort and must not roll back an invoice or duplicate reminders.
      console.error("Invoice payment reminder email failed:", error);
    }
  }
};

export const sendDueInvoicePaymentReminders = async (now = new Date()) => {
  const cutoff = new Date(now.getTime() - REMINDER_INTERVAL_MS);
  const jobs: any[] = await Jobs.find({
    milestones: {
      $elemMatch: {
        "invoice.invoiceRaised": true,
        paymentStatus: { $ne: MilestonePaymentStatus.paid },
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
    if (!owner) continue;

    for (const milestone of job.milestones || []) {
      if (!isInvoicePaymentReminderDue(milestone, now)) continue;
      const claim: any = await Jobs.updateOne(
        {
          _id: job._id,
          milestones: {
            $elemMatch: {
              _id: milestone._id,
              "invoice.invoiceRaised": true,
              paymentStatus: { $ne: MilestonePaymentStatus.paid },
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
        },
        {
          $set: { "milestones.$.invoice.paymentReminderLastSentAt": now },
          $inc: { "milestones.$.invoice.paymentReminderCount": 1 },
        },
      );
      if (claim.modifiedCount !== 1) continue;

      await sendInvoicePaymentReminder(job, milestone, owner);
      sent += 1;
    }
  }
  return sent;
};
