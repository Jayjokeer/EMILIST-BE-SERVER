import { BadRequestError, NotFoundError } from "../errors/error";
import { MilestonePaymentStatus } from "../enums/jobs.enum";
import { PaymentMethodEnum, ServiceEnum, TransactionEnum } from "../enums/transaction.enum";
import { verifyPaystackPayment } from "../utils/paystack";
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

// Repairs milestones left in `processing` by the legacy payment flow. A
// successful charge is finalized; an unsuccessful/abandoned card attempt is
// failed and the milestone is released so the owner can initialize a new one.
export const reconcileProcessingJobPayment = async (
  job: any,
  milestone: any,
  transaction: any,
  verifyPayment: (reference: string) => Promise<string> = verifyPaystackPayment,
) => {
  const finalizeExistingPayment = async () => {
    applySuccessfulJobPayment(job, transaction);
    await Promise.all([job.save(), transaction.save()]);
  };

  if (!transaction) {
    milestone.paymentStatus = MilestonePaymentStatus.unpaid;
    job.markModified?.("milestones");
    await job.save();
    return { outcome: "retry" as const, transaction: null };
  }

  if (
    transaction.status === TransactionEnum.completed ||
    transaction.paymentMethod === PaymentMethodEnum.wallet
  ) {
    await finalizeExistingPayment();
    return { outcome: "completed" as const, transaction };
  }

  if (transaction.reference) {
    const paystackStatus = await verifyPayment(String(transaction.reference));
    if (paystackStatus === "success") {
      await finalizeExistingPayment();
      return { outcome: "completed" as const, transaction };
    }
  }

  transaction.status = TransactionEnum.failed;
  transaction.dateCompleted = new Date();
  milestone.paymentStatus = MilestonePaymentStatus.unpaid;
  job.markModified?.("milestones");
  await Promise.all([job.save(), transaction.save()]);
  return { outcome: "retry" as const, transaction };
};
