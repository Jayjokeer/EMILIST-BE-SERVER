import { BadRequestError, NotFoundError } from "../errors/error";
import { MilestonePaymentStatus } from "../enums/jobs.enum";
import { ServiceEnum, TransactionEnum } from "../enums/transaction.enum";
import * as jobService from "./job.service";

export const applySuccessfulJobPayment = (
  job: any,
  transaction: any,
  completedAt = new Date(),
) => {
  const milestone = (job.milestones || []).find(
    (item: any) => String(item._id) === String(transaction.milestoneId),
  );
  if (!milestone) throw new NotFoundError("Milestone not found for this payment");

  milestone.paymentStatus = MilestonePaymentStatus.paid;
  milestone.datePaid = milestone.datePaid || completedAt;
  milestone.paymentInfo = {
    ...(milestone.paymentInfo?.toObject?.() || milestone.paymentInfo || {}),
    amountPaid: transaction.amount,
    paymentMethod: transaction.paymentMethod,
    date: completedAt,
  };
  if (milestone.invoice) milestone.invoice.reviewStatus = "paid";

  transaction.status = TransactionEnum.completed;
  transaction.dateCompleted = transaction.dateCompleted || completedAt;
  return { job, milestone, transaction };
};

export const completeJobPayment = async (transaction: any) => {
  if (!transaction || transaction.serviceType !== ServiceEnum.job) {
    throw new BadRequestError("This is not a job payment transaction");
  }
  if (!transaction.jobId || !transaction.milestoneId) {
    throw new BadRequestError("Job payment transaction is missing its job or milestone ID");
  }

  const job = await jobService.fetchJobById(String(transaction.jobId));
  if (!job) throw new NotFoundError("Job not found");

  applySuccessfulJobPayment(job, transaction);
  await Promise.all([job.save(), transaction.save()]);
  return { job, transaction };
};
