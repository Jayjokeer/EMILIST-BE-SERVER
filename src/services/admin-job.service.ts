import { Types } from "mongoose";
import { BadRequestError, NotFoundError } from "../errors/error";
import { AdminJobActionEnum, JobFrequencyEnum, JobStatusEnum, MilestonePaymentStatus } from "../enums/jobs.enum";
import Jobs from "../models/jobs.model";
import Project from "../models/project.model";
import Transaction from "../models/transaction.model";
import Users from "../models/users.model";
import Business from "../models/business.model";
import Review from "../models/review.model";
import AdminAction from "../models/admin-action.model";
import { TransactionEnum } from "../enums/transaction.enum";

export const adminJobPagination = (pageValue: unknown, limitValue: unknown) => {
  const page = Math.max(1, Number(pageValue) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

export const jobDisplayStatus = (job: any) => !job.isListed && job.status === JobStatusEnum.listed
  ? JobStatusEnum.draft
  : job.status;

const assertJobId = (jobId: string) => {
  if (!Types.ObjectId.isValid(jobId)) throw new BadRequestError("Invalid job id");
};

const amountFor = (job: any) => job.totalBudget?.amount ?? job.estimatedBudget?.amount
  ?? job.recurringBudget?.amount ?? job.maximumPrice ?? job.budget ?? 0;
const currencyFor = (job: any) => job.totalBudget?.currency ?? job.estimatedBudget?.currency
  ?? job.recurringBudget?.currency ?? job.currency ?? "NGN";
const durationFor = (job: any) => job.jobDuration
  ? `${job.jobDuration.value} ${job.jobDuration.unit}`
  : job.duration?.number ? `${job.duration.number} ${job.duration.period}` : null;

export const fetchAdminJobSummary = async () => {
  const [rows, applicants] = await Promise.all([
    Jobs.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Project.countDocuments(),
  ]);
  const counts = Object.fromEntries(rows.map((row: any) => [row._id, row.count]));
  return {
    total: rows.reduce((sum: number, row: any) => sum + row.count, 0),
    active: counts[JobStatusEnum.active] || 0,
    applicants,
    overdue: counts[JobStatusEnum.overdue] || 0,
    paused: counts[JobStatusEnum.paused] || 0,
    completed: counts[JobStatusEnum.complete] || 0,
  };
};

export const fetchAdminJobs = async (query: any) => {
  const { page, limit, skip } = adminJobPagination(query.page, query.limit);
  const filter: any = {};
  if (query.status) {
    if (query.status === JobStatusEnum.draft) {
      filter.$or = [{ status: JobStatusEnum.draft }, { status: JobStatusEnum.listed, isListed: false }];
    } else filter.status = query.status;
  }
  const search = String(query.search || "").trim();
  if (search) {
    const users = await Users.find({ $or: [
      { firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } },
      { userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } },
    ] }).select("_id").lean();
    const searchFilter = { $or: [
      { title: { $regex: search, $options: "i" } },
      { expertId: { $regex: search, $options: "i" } },
      { userId: { $in: users.map((user: any) => user._id) } },
      ...(Types.ObjectId.isValid(search) ? [{ _id: new Types.ObjectId(search) }] : []),
    ] };
    filter.$and = [...(filter.$and || []), searchFilter];
  }
  const [jobs, total] = await Promise.all([
    Jobs.find(filter).populate("userId", "firstName lastName userName uniqueId email")
      .populate({ path: "acceptedApplicationId", select: "user businessId", populate: [
        { path: "user", select: "userName uniqueId" }, { path: "businessId", select: "businessName uniqueId" },
      ] }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Jobs.countDocuments(filter),
  ]);
  return {
    jobs: jobs.map((job: any) => ({
      id: job._id, createdAt: job.createdAt, title: job.title,
      postedBy: job.userId, duration: durationFor(job), budget: amountFor(job), currency: currencyFor(job),
      applicants: job.applications?.length || 0,
      expert: job.acceptedApplicationId?.businessId || job.acceptedApplicationId?.user || null,
      status: jobDisplayStatus(job), isListed: job.isListed,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const fetchJob = async (jobId: string) => {
  assertJobId(jobId);
  const job: any = await Jobs.findById(jobId).populate("userId", "firstName lastName userName uniqueId displayImage email")
    .populate({ path: "acceptedApplicationId", populate: [
      { path: "user", select: "firstName lastName userName uniqueId displayImage level" },
      { path: "businessId", select: "businessName uniqueId displayImage startingPrice rateUnit currency businessImages reviews services businessDescription address city state country" },
    ] }).lean();
  if (!job) throw new NotFoundError("Job not found");
  return job;
};

export const fetchAdminJobDetails = async (jobId: string) => {
  const job: any = await fetchJob(jobId);
  const status = jobDisplayStatus(job);
  return {
    ...job,
    status,
    availableActions: adminJobActionsForStatus(status),
    displayBudget: { amount: amountFor(job), currency: currencyFor(job) },
    displayDuration: durationFor(job),
    applicantsCount: job.applications?.length || 0,
  };
};

export const fetchAdminJobApplicants = async (jobId: string, query: any) => {
  await fetchJob(jobId);
  const { page, limit, skip } = adminJobPagination(query.page, query.limit);
  const filter: any = { job: jobId };
  if (query.status) filter.status = query.status;
  const [applications, total] = await Promise.all([
    Project.find(filter).populate("user", "firstName lastName userName uniqueId displayImage level")
      .populate("businessId", "businessName uniqueId displayImage startingPrice rateUnit currency address city state country services reviews businessImages businessDescription")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Project.countDocuments(filter),
  ]);
  const businessIds = applications.map((item: any) => item.businessId?._id).filter(Boolean);
  const ratingRows = businessIds.length ? await Review.aggregate([
    { $match: { businessId: { $in: businessIds } } },
    { $group: { _id: "$businessId", rating: { $avg: "$rating" }, reviews: { $sum: 1 } } },
  ]) : [];
  const ratings = new Map(ratingRows.map((row: any) => [String(row._id), row]));
  return {
    applications: applications.map((item: any) => ({
      ...item,
      rating: ratings.get(String(item.businessId?._id))?.rating || 0,
      reviewCount: ratings.get(String(item.businessId?._id))?.reviews || 0,
    })),
    hiredApplicationId: jobId && String((await Jobs.findById(jobId).select("acceptedApplicationId").lean() as any)?.acceptedApplicationId || "") || null,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const fetchAdminJobInvoices = async (jobId: string) => {
  const job: any = await fetchJob(jobId);
  const invoices = (job.milestones || []).filter((item: any) => item.invoice?.invoiceRaised).map((item: any, index: number) => ({
    id: item.invoice.invoiceId || item._id,
    number: String(item.invoice.invoiceId || item._id),
    title: `Invoice ${index + 1}`,
    tag: item.achievement || `Milestone ${index + 1}`,
    issuedAt: item.invoice.issuedAt,
    dueAt: item.timeFrame?.date || null,
    subtotal: (item.amount || 0) + (item.invoice.additionalAmount || 0),
    currency: item.currency || job.currency || "NGN",
    status: item.paymentStatus === MilestonePaymentStatus.paid ? "paid" : item.invoice.reviewStatus || "unpaid",
    note: item.invoice.note,
  }));
  return {
    invoices,
    log: {
      total: invoices.length,
      milestone: invoices.filter((item: any) => !String(item.tag).toLowerCase().includes("additional")).length,
      additional: invoices.filter((item: any) => String(item.tag).toLowerCase().includes("additional")).length,
      paid: invoices.filter((item: any) => item.status === "paid").length,
      pending: invoices.filter((item: any) => item.status !== "paid").length,
      overdue: invoices.filter((item: any) => item.dueAt && new Date(item.dueAt) < new Date() && item.status !== "paid").length,
    },
    totalPayable: invoices.reduce((sum: number, item: any) => sum + item.subtotal, 0),
  };
};

export const fetchAdminJobInvoice = async (jobId: string, invoiceId: string) => {
  const data = await fetchAdminJobInvoices(jobId);
  const invoice = data.invoices.find((item: any) => String(item.id) === invoiceId || item.number === invoiceId);
  if (!invoice) throw new NotFoundError("Job invoice not found");
  return invoice;
};

export const fetchAdminJobPayments = async (jobId: string) => {
  const job: any = await fetchJob(jobId);
  const payments: any[] = await Transaction.find({ jobId }).populate("recieverId", "firstName lastName userName")
    .sort({ createdAt: -1 }).lean();
  const rows = payments.map((payment: any) => ({
    id: payment._id, reference: payment.reference, amount: payment.amount, currency: payment.currency || job.currency || "NGN",
    recipient: payment.recieverId, tag: payment.milestoneId ? "milestone" : "additional",
    date: payment.dateCompleted || payment.createdAt, status: payment.status,
  }));
  return {
    payments: rows,
    log: {
      total: rows.length,
      milestone: rows.filter((row) => row.tag === "milestone").length,
      additional: rows.filter((row) => row.tag === "additional").length,
      paid: rows.filter((row) => row.status === TransactionEnum.completed).length,
      pending: rows.filter((row) => [TransactionEnum.pending, TransactionEnum.processing].includes(row.status)).length,
      overdue: (job.milestones || []).filter((item: any) => item.status === "overdue" && item.paymentStatus !== MilestonePaymentStatus.paid).length,
    },
    completedAmount: rows.filter((row) => row.status === TransactionEnum.completed).reduce((sum, row) => sum + row.amount, 0),
    upcomingAmount: (job.milestones || []).filter((item: any) => item.paymentStatus !== MilestonePaymentStatus.paid)
      .reduce((sum: number, item: any) => sum + (item.amount || 0), 0),
  };
};

export const fetchAdminJobPayment = async (jobId: string, paymentId: string) => {
  if (!Types.ObjectId.isValid(paymentId)) throw new BadRequestError("Invalid payment id");
  await fetchJob(jobId);
  const payment: any = await Transaction.findOne({ _id: paymentId, jobId })
    .populate("userId", "firstName lastName userName email")
    .populate("recieverId", "firstName lastName userName email")
    .lean();
  if (!payment) throw new NotFoundError("Job payment not found");
  return payment;
};

const allowedActions: Record<string, JobStatusEnum[]> = {
  [AdminJobActionEnum.approveListing]: [JobStatusEnum.listed],
  [AdminJobActionEnum.rejectListing]: [JobStatusEnum.listed],
  [AdminJobActionEnum.removeListing]: [JobStatusEnum.draft, JobStatusEnum.in_review],
  [AdminJobActionEnum.pause]: [JobStatusEnum.active],
  [AdminJobActionEnum.resume]: [JobStatusEnum.paused],
  [AdminJobActionEnum.cancel]: [JobStatusEnum.overdue],
  [AdminJobActionEnum.convertToRecurring]: [JobStatusEnum.complete],
};

export const adminJobActionsForStatus = (status: JobStatusEnum) =>
  Object.entries(allowedActions).filter(([, statuses]) => statuses.includes(status)).map(([action]) => action);

export const applyAdminJobAction = async (jobId: string, adminId: string, body: any) => {
  assertJobId(jobId);
  const job: any = await Jobs.findById(jobId);
  if (!job) throw new NotFoundError("Job not found");
  const displayedStatus = jobDisplayStatus(job);
  if (!allowedActions[body.action]?.includes(displayedStatus)) {
    throw new BadRequestError(`${body.action} is not allowed while the job is ${displayedStatus}`);
  }
  const previousState = { status: job.status, isListed: job.isListed, jobUrgency: job.jobUrgency };
  switch (body.action) {
    case AdminJobActionEnum.approveListing: job.status = JobStatusEnum.listed; job.isListed = true; break;
    case AdminJobActionEnum.rejectListing:
    case AdminJobActionEnum.removeListing: job.status = JobStatusEnum.draft; job.isListed = false; break;
    case AdminJobActionEnum.pause: job.status = JobStatusEnum.paused; job.pausedDate = new Date(); break;
    case AdminJobActionEnum.resume: job.status = JobStatusEnum.active; job.pausedDate = undefined; break;
    case AdminJobActionEnum.cancel: job.status = JobStatusEnum.cancelled; job.isClosed = true; break;
    case AdminJobActionEnum.convertToRecurring:
      job.jobUrgency = "regularly";
      job.jobFrequency = body.frequency as JobFrequencyEnum;
      job.startDate = body.startDate;
      job.endDate = body.endDate;
      job.recurringBudget = { currency: body.currency, amount: body.amount, period: body.budgetPeriod };
      break;
  }
  job.adminAction = { action: body.action, reason: body.reason, adminId, actedAt: new Date() };
  await job.save();
  await AdminAction.create({
    adminId, targetUserId: job.userId || undefined, targetType: "job", targetId: job._id,
    action: `job.${body.action}`, reason: body.reason,
    previousState, newState: { status: job.status, isListed: job.isListed, jobUrgency: job.jobUrgency },
    metadata: { jobId: job._id },
  });
  return fetchAdminJobDetails(jobId);
};
