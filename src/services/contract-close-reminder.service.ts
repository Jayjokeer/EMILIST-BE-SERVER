import { MilestoneEnum, MilestonePaymentStatus } from "../enums/jobs.enum";
import { NotificationLevelEnum, NotificationTypeEnum } from "../enums/notification.enum";
import Jobs from "../models/jobs.model";
import { config } from "../utils/config";
import { buildFrontendUrl } from "../utils/frontend-url";
import { sendEmail } from "../utils/send_email";
import { contractCloseReminderEmail } from "../utils/templates";
import * as notificationService from "./notification.service";

export const CONTRACT_CLOSE_REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const isContractCloseReminderDue = (job: any, now = new Date()) => {
  const milestones = Array.isArray(job?.milestones) ? job.milestones : [];
  if (job?.isClosed || milestones.length === 0) return false;
  if (milestones.some((milestone: any) => milestone.status !== MilestoneEnum.completed)) return false;
  if (milestones.some((milestone: any) => milestone.paymentStatus !== MilestonePaymentStatus.paid)) return false;
  if (milestones.some((milestone: any) => milestone.invoice?.disputeStatus === "open")) return false;

  const lastSentAt = job.contractCloseReminderLastSentAt;
  if (!lastSentAt) return true;
  return now.getTime() - new Date(lastSentAt).getTime() >= CONTRACT_CLOSE_REMINDER_INTERVAL_MS;
};

const eligibleContractQuery = () => ({
  isClosed: { $ne: true },
  "milestones.0": { $exists: true },
  $nor: [
    { milestones: { $elemMatch: { status: { $ne: MilestoneEnum.completed } } } },
    { milestones: { $elemMatch: { paymentStatus: { $ne: MilestonePaymentStatus.paid } } } },
    { milestones: { $elemMatch: { "invoice.disputeStatus": "open" } } },
  ],
});

export const sendContractCloseReminder = async (job: any, owner: any) => {
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
    type: NotificationTypeEnum.job,
    level: NotificationLevelEnum.alert,
    resourceId: jobId,
    action: "close_job_contract",
    metadata: { jobId },
  });

  if (!owner.email) return;
  const closeContractUrl = buildFrontendUrl(config.frontendUrl, {
    query: { action: "close-job-contract", jobId },
  });
  const { subject, html } = contractCloseReminderEmail(ownerName, jobTitle, closeContractUrl);
  try {
    await sendEmail(owner.email, subject, html);
  } catch (error) {
    console.error("Contract close reminder email failed:", error);
  }
};

export const sendDueContractCloseReminders = async (now = new Date()) => {
  const cutoff = new Date(now.getTime() - CONTRACT_CLOSE_REMINDER_INTERVAL_MS);
  const reminderWindow = {
    $or: [
      { contractCloseReminderLastSentAt: { $lte: cutoff } },
      { contractCloseReminderLastSentAt: { $exists: false } },
    ],
  };
  const jobs: any[] = await Jobs.find({
    ...eligibleContractQuery(),
    ...reminderWindow,
  }).populate("userId", "firstName lastName userName email");

  let sent = 0;
  for (const job of jobs) {
    const owner = job.userId;
    if (!owner || !isContractCloseReminderDue(job, now)) continue;

    const claim = await Jobs.updateOne(
      {
        _id: job._id,
        ...eligibleContractQuery(),
        ...reminderWindow,
      },
      {
        $set: { contractCloseReminderLastSentAt: now },
        $inc: { contractCloseReminderCount: 1 },
      },
    );
    if (claim.modifiedCount !== 1) continue;

    await sendContractCloseReminder(job, owner);
    sent += 1;
  }

  return sent;
};
