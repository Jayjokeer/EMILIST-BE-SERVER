import { Types } from "mongoose";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/error";
import { InvoiceDisputeType, SupportRequestCategory, SupportRequestPriority, SupportRequestStatus } from "../enums/support.enum";
import SupportRequest from "../models/support-request.model";
import Admin from "../models/admin.model";
import Users from "../models/users.model";
import Jobs from "../models/jobs.model";
import { MilestonePaymentStatus } from "../enums/jobs.enum";
import Project from "../models/project.model";

export const supportPagination = (pageValue: unknown, limitValue: unknown) => {
  const page = Math.max(1, Number(pageValue) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const assertId = (value: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new BadRequestError(`Invalid ${label}`);
};

export const createSupportRequest = async (requesterId: string, body: any) => {
  assertId(requesterId, "requester id");
  const request = await SupportRequest.create({
    ...body,
    requesterId,
    lastMessageAt: new Date(),
    messages: [{ senderType: "customer", senderUserId: requesterId, content: body.description, attachments: body.attachments || [] }],
  });
  request.history.push({ action: "created", note: "Support ticket created" });
  await request.save();
  return fetchSupportRequest(String(request._id));
};

export const INVOICE_NON_PAYMENT_GRACE_DAYS = 7;

export const invoiceDisputeMilestone = (
  job: any,
  requesterId: string,
  milestoneId: string,
  invoiceId?: string,
  disputeType: InvoiceDisputeType = InvoiceDisputeType.ownerUnsatisfiedWork,
  acceptedArtisanId?: string,
  now = new Date(),
) => {
  const isOwner = String(job.userId?._id || job.userId) === String(requesterId);
  const isArtisan = Boolean(acceptedArtisanId) && String(acceptedArtisanId) === String(requesterId);
  if (!isOwner && !isArtisan) throw new ForbiddenError("Only the job owner or accepted artisan can dispute this invoice");
  const milestone = (job.milestones || []).find((item: any) => String(item._id) === String(milestoneId));
  if (!milestone) throw new NotFoundError("Milestone not found");
  if (!milestone.invoice?.invoiceRaised || !milestone.invoice?.invoiceId) {
    throw new BadRequestError("No invoice has been raised for this milestone");
  }
  if (milestone.paymentStatus === MilestonePaymentStatus.processing) {
    throw new BadRequestError("The invoice payment is currently being processed");
  }
  if (invoiceId && String(milestone.invoice.invoiceId) !== String(invoiceId)) {
    throw new BadRequestError("Invoice does not belong to this milestone");
  }
  const ownerTypes = [InvoiceDisputeType.ownerUnsatisfiedWork, InvoiceDisputeType.ownerAdditionalCostReason];
  const artisanTypes = [InvoiceDisputeType.artisanAdditionalCostUnpaid, InvoiceDisputeType.artisanInvoiceUnpaidOverdue];
  if (isOwner && !ownerTypes.includes(disputeType)) throw new ForbiddenError("This dispute type is only available to the artisan");
  if (isArtisan && !artisanTypes.includes(disputeType)) throw new ForbiddenError("This dispute type is only available to the job owner");

  const originalAmount = Number(milestone.amount || 0);
  const additionalAmount = Math.max(0, Number(milestone.invoice.additionalAmount || 0));
  const amountPaid = Math.max(0, Number(milestone.paymentInfo?.amountPaid || 0));

  if (disputeType === InvoiceDisputeType.ownerAdditionalCostReason && additionalAmount <= 0) {
    throw new BadRequestError("This invoice does not contain an additional cost");
  }
  if (disputeType === InvoiceDisputeType.artisanAdditionalCostUnpaid) {
    if (additionalAmount <= 0) throw new BadRequestError("This invoice does not contain an additional cost");
    if (amountPaid <= 0) throw new BadRequestError("The original invoice payment has not been made yet");
    if (amountPaid >= originalAmount + additionalAmount) throw new BadRequestError("The additional cost has already been paid");
  }
  if (disputeType === InvoiceDisputeType.artisanInvoiceUnpaidOverdue) {
    if (milestone.paymentStatus === MilestonePaymentStatus.paid) throw new BadRequestError("This invoice has already been paid");
    if (!milestone.invoice.issuedAt) throw new BadRequestError("Invoice issue date is unavailable");
    const eligibleAt = new Date(milestone.invoice.issuedAt);
    eligibleAt.setDate(eligibleAt.getDate() + INVOICE_NON_PAYMENT_GRACE_DAYS);
    if (now < eligibleAt) {
      throw new BadRequestError(`The invoice must remain unpaid for ${INVOICE_NON_PAYMENT_GRACE_DAYS} days before a dispute can be raised`);
    }
  }

  return { milestone, raisedByRole: isOwner ? "job_owner" as const : "artisan" as const };
};

export const createInvoiceDispute = async (requesterId: string, body: any) => {
  assertId(requesterId, "requester id");
  assertId(body.jobId, "job id");
  assertId(body.milestoneId, "milestone id");
  const job: any = await Jobs.findById(body.jobId);
  if (!job) throw new NotFoundError("Job not found");
  const acceptedProject: any = job.acceptedApplicationId
    ? await Project.findById(job.acceptedApplicationId).select("user").lean()
    : null;
  const { milestone, raisedByRole } = invoiceDisputeMilestone(
    job,
    requesterId,
    body.milestoneId,
    body.invoiceId,
    body.disputeType,
    acceptedProject?.user ? String(acceptedProject.user) : undefined,
  );

  const existing: any = await SupportRequest.findOne({
    jobId: job._id,
    milestoneId: milestone._id,
    category: SupportRequestCategory.dispute,
    status: { $ne: SupportRequestStatus.resolved },
  });
  if (existing) {
    throw new BadRequestError(`An open dispute already exists for this invoice (${existing.ticketCode || existing._id})`);
  }

  const request: any = await SupportRequest.create({
    requesterId,
    subject: body.subject || `Invoice dispute: ${job.title || "Job invoice"}`,
    description: body.reason,
    category: SupportRequestCategory.dispute,
    priority: SupportRequestPriority.high,
    status: SupportRequestStatus.open,
    linkedType: "job",
    linkedRecordId: job._id,
    jobId: job._id,
    milestoneId: milestone._id,
    invoiceId: milestone.invoice.invoiceId,
    disputeType: body.disputeType,
    raisedByRole,
    lastMessageAt: new Date(),
    messages: [{
      senderType: "customer",
      senderUserId: requesterId,
      content: body.reason,
      attachments: body.attachments || [],
    }],
  });
  request.history.push({ action: "invoice_disputed", note: "Job owner disputed the invoice" });
  await request.save();

  milestone.invoice.disputeTicketId = request._id;
  milestone.invoice.disputeStatus = "open";
  milestone.invoice.reviewStatus = "rejected";
  milestone.invoice.rejectedAt = new Date();
  milestone.invoice.rejectionReason = body.reason;
  job.markModified("milestones");
  await job.save();
  return fetchSupportRequest(String(request._id));
};

export const fetchUserSupportRequests = async (requesterId: string, query: any) => {
  assertId(requesterId, "requester id");
  const { page, limit, skip } = supportPagination(query.page, query.limit);
  const filter: any = { requesterId };
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  const [requests, total] = await Promise.all([
    SupportRequest.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    SupportRequest.countDocuments(filter),
  ]);
  return { requests: requests.map((request: any) => displayRequest(request)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const fetchUserSupportRequest = async (requesterId: string, requestId: string) => {
  assertId(requesterId, "requester id");
  assertId(requestId, "support request id");
  const request: any = await SupportRequest.findOne({ _id: requestId, requesterId })
    .populate("messages.senderAdminId", "fullName department profileImage")
    .populate("messages.senderUserId", "firstName lastName userName displayImage")
    .lean();
  if (!request) throw new NotFoundError("Support request not found");
  return displayRequest(request);
};

const SLA_HOURS = 24;
const SUPPORT_TREND_DAYS = 7;
const overdueCutoff = (now = new Date()) => new Date(now.getTime() - SLA_HOURS * 60 * 60 * 1000);
const isResolved = (status: string) => status === SupportRequestStatus.resolved;
const elapsedSeconds = (from: Date, to = new Date()) => Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
const displayRequest = (request: any, now = new Date()) => {
  const createdAt = new Date(request.createdAt);
  const resolvedAt = request.resolvedAt ? new Date(request.resolvedAt) : undefined;
  const isOverdue = !isResolved(request.status) && createdAt < overdueCutoff(now);
  return {
    ...request,
    ticketCode: request.ticketCode || `TKT-${String(request._id).slice(-6).toUpperCase()}`,
    displayStatus: isResolved(request.status) ? "resolved" : isOverdue ? "overdue" : "pending",
    isOverdue,
    queueSeconds: elapsedSeconds(createdAt, resolvedAt || now),
    queueTime: elapsedSeconds(createdAt, resolvedAt || now),
  };
};

type SupportTrendMetric = { current: number; previous: number };
type SupportTrendMetrics = Record<"total" | "unassigned" | "highPriority" | "overdue" | "pendingCustomer" | "averageResolution", SupportTrendMetric>;

export const supportTrend = (current: number, previous: number, lowerIsBetter = true) => {
  const percentage = previous === 0 ? (current === 0 ? 0 : 100) : Number((((current - previous) / previous) * 100).toFixed(1));
  const direction = percentage > 0 ? "up" : percentage < 0 ? "down" : "flat";
  return {
    percentage: Math.abs(percentage),
    signedPercentage: percentage,
    direction,
    isImprovement: direction === "flat" ? null : lowerIsBetter ? direction === "down" : direction === "up",
    comparison: `previous_${SUPPORT_TREND_DAYS}_days`,
    currentPeriodValue: current,
    previousPeriodValue: previous,
  };
};

const formatResolutionTime = (seconds: number) => {
  if (!seconds) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  if (minutes) return `${minutes}m`;
  return `${seconds}s`;
};

export const supportCards = (summary: any, trends: SupportTrendMetrics) => ({
  totalTickets: {
    key: "totalTickets", title: "Total Tickets", value: summary.ticketCount,
    displayValue: String(summary.ticketCount), description: "All support requests",
    trend: supportTrend(trends.total.current, trends.total.previous),
  },
  unassignedTickets: {
    key: "unassignedTickets", title: "Unassigned Tickets", value: summary.unassignedTickets,
    displayValue: String(summary.unassignedTickets), description: "Open tickets with no admin or team assigned",
    trend: supportTrend(trends.unassigned.current, trends.unassigned.previous),
  },
  highPriorityTickets: {
    key: "highPriorityTickets", title: "High Priority Tickets", value: summary.highPriorityTickets,
    displayValue: String(summary.highPriorityTickets), description: "Unresolved high, critical, or urgent tickets",
    trend: supportTrend(trends.highPriority.current, trends.highPriority.previous),
  },
  overdueTickets: {
    key: "overdueTickets", title: "Overdue Tickets", value: summary.overdueTickets,
    displayValue: String(summary.overdueTickets), description: `Unresolved tickets older than the ${summary.slaHours}-hour SLA`,
    trend: supportTrend(trends.overdue.current, trends.overdue.previous),
  },
  awaitingCustomerResponse: {
    key: "awaitingCustomerResponse", title: "Awaiting Customer Response", value: summary.pendingTickets,
    displayValue: String(summary.pendingTickets), description: "Tickets currently waiting for a customer reply",
    trend: supportTrend(trends.pendingCustomer.current, trends.pendingCustomer.previous),
  },
  averageResolutionTime: {
    key: "averageResolutionTime", title: "Average Resolution Time",
    value: summary.averageResolution.seconds || null,
    displayValue: formatResolutionTime(summary.averageResolution.seconds),
    unit: "seconds", description: `Average for tickets resolved in the last ${SUPPORT_TREND_DAYS} days`,
    resolvedInPeriod: summary.averageResolution.resolvedInPeriod,
    trend: supportTrend(trends.averageResolution.current, trends.averageResolution.previous),
  },
});

const fetchSupportTrendMetrics = async (now: Date): Promise<SupportTrendMetrics> => {
  const currentStart = new Date(now.getTime() - SUPPORT_TREND_DAYS * 24 * 60 * 60 * 1000);
  const previousStart = new Date(currentStart.getTime() - SUPPORT_TREND_DAYS * 24 * 60 * 60 * 1000);
  const unresolved = { status: { $ne: SupportRequestStatus.resolved } };
  const unassigned = { ...unresolved, assignedAdminId: { $exists: false }, assignedTeam: { $in: [null, ""] } };
  const highPriority = { ...unresolved, priority: { $in: [SupportRequestPriority.high, SupportRequestPriority.critical, SupportRequestPriority.urgent] } };
  const overdue = { ...unresolved, createdAt: { $lt: overdueCutoff(now) } };
  const countFacet = (match: Record<string, unknown>) => [{ $match: match }, { $count: "value" }];
  const resolutionFacet = (start: Date, end: Date) => [
    { $match: { status: SupportRequestStatus.resolved, resolvedAt: { $gte: start, $lt: end } } },
    { $group: { _id: null, value: { $avg: { $subtract: ["$resolvedAt", "$createdAt"] } } } },
  ];
  const [row] = await SupportRequest.aggregate([{ $facet: {
    totalCurrent: countFacet({ createdAt: { $gte: currentStart, $lte: now } }),
    totalPrevious: countFacet({ createdAt: { $gte: previousStart, $lt: currentStart } }),
    unassignedCurrent: countFacet({ ...unassigned, createdAt: { $gte: currentStart, $lte: now } }),
    unassignedPrevious: countFacet({ ...unassigned, createdAt: { $gte: previousStart, $lt: currentStart } }),
    highPriorityCurrent: countFacet({ ...highPriority, createdAt: { $gte: currentStart, $lte: now } }),
    highPriorityPrevious: countFacet({ ...highPriority, createdAt: { $gte: previousStart, $lt: currentStart } }),
    overdueCurrent: countFacet({ ...overdue, createdAt: { $gte: currentStart, $lt: overdueCutoff(now) } }),
    overduePrevious: countFacet({ ...unresolved, createdAt: { $gte: previousStart, $lt: currentStart } }),
    pendingCustomerCurrent: countFacet({ status: SupportRequestStatus.pendingCustomer, createdAt: { $gte: currentStart, $lte: now } }),
    pendingCustomerPrevious: countFacet({ status: SupportRequestStatus.pendingCustomer, createdAt: { $gte: previousStart, $lt: currentStart } }),
    averageResolutionCurrent: resolutionFacet(currentStart, now),
    averageResolutionPrevious: resolutionFacet(previousStart, currentStart),
  } }]);
  const value = (key: string, milliseconds = false) => {
    const result = Number(row?.[key]?.[0]?.value || 0);
    return milliseconds ? Math.round(result / 1000) : result;
  };
  return {
    total: { current: value("totalCurrent"), previous: value("totalPrevious") },
    unassigned: { current: value("unassignedCurrent"), previous: value("unassignedPrevious") },
    highPriority: { current: value("highPriorityCurrent"), previous: value("highPriorityPrevious") },
    overdue: { current: value("overdueCurrent"), previous: value("overduePrevious") },
    pendingCustomer: { current: value("pendingCustomerCurrent"), previous: value("pendingCustomerPrevious") },
    averageResolution: { current: value("averageResolutionCurrent", true), previous: value("averageResolutionPrevious", true) },
  };
};

export const fetchSupportSummary = async (now = new Date()) => {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const cutoff = overdueCutoff(now);
  const unresolved = { status: { $ne: SupportRequestStatus.resolved } };
  const [ticketCount, unassignedTickets, highPriorityTickets, overdueTickets, pendingTickets, resolutionRows, trends] = await Promise.all([
    SupportRequest.countDocuments(),
    SupportRequest.countDocuments({ ...unresolved, assignedAdminId: { $exists: false }, assignedTeam: { $in: [null, ""] } }),
    SupportRequest.countDocuments({ ...unresolved, priority: { $in: [SupportRequestPriority.high, SupportRequestPriority.critical, SupportRequestPriority.urgent] } }),
    SupportRequest.countDocuments({ ...unresolved, createdAt: { $lt: cutoff } }),
    SupportRequest.countDocuments({ status: SupportRequestStatus.pendingCustomer }),
    SupportRequest.aggregate([
      { $match: { status: SupportRequestStatus.resolved, resolvedAt: { $gte: weekAgo, $lte: now } } },
      { $project: { duration: { $subtract: ["$resolvedAt", "$createdAt"] } } },
      { $group: { _id: null, averageMilliseconds: { $avg: "$duration" }, count: { $sum: 1 } } },
    ]),
    fetchSupportTrendMetrics(now),
  ]);
  const averageResolutionSeconds = Math.round((resolutionRows[0]?.averageMilliseconds || 0) / 1000);
  const summary: any = {
    ticketCount,
    unassignedTickets,
    highPriorityTickets,
    overdueTickets,
    pendingTickets,
    averageResolution: {
      seconds: averageResolutionSeconds,
      hours: Math.floor(averageResolutionSeconds / 3600),
      minutes: Math.floor((averageResolutionSeconds % 3600) / 60),
      resolvedInPeriod: resolutionRows[0]?.count || 0,
      period: "7d",
    },
    slaHours: SLA_HOURS,
  };
  summary.cards = supportCards(summary, trends);
  return summary;
};

export const fetchSupportRequests = async (query: any) => {
  const { page, limit, skip } = supportPagination(query.page, query.limit);
  const filter: any = {};
  const cutoff = overdueCutoff();
  if (query.status === "overdue") {
    filter.status = { $ne: SupportRequestStatus.resolved };
    filter.createdAt = { $lt: cutoff };
  } else if (query.status === "pending") {
    filter.status = { $ne: SupportRequestStatus.resolved };
  } else if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;
  if (query.team) filter.assignedTeam = String(query.team);
  if (query.assignedAdminId === "unassigned") {
    filter.assignedAdminId = { $exists: false };
    filter.assignedTeam = { $in: [null, ""] };
  } else if (query.assignedAdminId && Types.ObjectId.isValid(String(query.assignedAdminId))) {
    filter.assignedAdminId = query.assignedAdminId;
  }
  if (query.search) {
    const search = String(query.search).trim();
    filter.$or = [
      { ticketCode: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
    if (Types.ObjectId.isValid(search)) filter.$or.push({ requesterId: new Types.ObjectId(search) });
    const users = await Users.find({
      $or: [
        { firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id").lean();
    if (users.length) filter.$or.push({ requesterId: { $in: users.map((user: any) => user._id) } });
  }

  const [requests, total, statusRows, overdue, summary] = await Promise.all([
    SupportRequest.find(filter)
      .populate("requesterId", "firstName lastName userName email uniqueId displayImage")
      .populate("assignedAdminId", "fullName email department")
      .populate("jobId", "title status userId")
      .sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    SupportRequest.countDocuments(filter),
    SupportRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    SupportRequest.countDocuments({ status: { $ne: SupportRequestStatus.resolved }, createdAt: { $lt: cutoff } }),
    fetchSupportSummary(),
  ]);
  return {
    requests: requests.map((request: any) => displayRequest(request)),
    cards: summary.cards,
    counts: supportStatusCounts(statusRows, overdue),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const supportStatusCounts = (statusRows: Array<{ _id: string; count: number }>, overdue: number) => {
  const counts = Object.fromEntries(statusRows.map((row) => [row._id, Number(row.count) || 0]));
  return {
    total: statusRows.reduce((sum, row) => sum + (Number(row.count) || 0), 0),
    open: counts[SupportRequestStatus.open] || 0,
    inProgress: counts[SupportRequestStatus.inProgress] || 0,
    pendingCustomer: counts[SupportRequestStatus.pendingCustomer] || 0,
    pendingResolution: counts[SupportRequestStatus.pendingResolution] || 0,
    resolved: counts[SupportRequestStatus.resolved] || 0,
    overdue,
  };
};

export const fetchSupportRequest = async (requestId: string) => {
  assertId(requestId, "support request id");
  const request = await SupportRequest.findById(requestId)
    .populate("requesterId", "firstName lastName userName email uniqueId displayImage status")
    .populate("assignedAdminId", "fullName email department")
    .populate("jobId", "title status userId")
    .populate("history.adminId", "fullName email department")
    .populate("messages.senderAdminId", "fullName email department profileImage")
    .populate("messages.senderUserId", "firstName lastName userName email displayImage")
    .populate("adminNotes.adminId", "fullName email department")
    .lean();
  if (!request) throw new NotFoundError("Support request not found");
  return displayRequest(request);
};

export const updateSupportRequest = async (requestId: string, adminId: string, body: any) => {
  assertId(requestId, "support request id");
  const request: any = await SupportRequest.findById(requestId);
  if (!request) throw new NotFoundError("Support request not found");
  const previousStatus = request.status;
  if (body.status) request.status = body.status;
  if (body.priority) request.priority = body.priority;
  if (body.assignedAdminId !== undefined) {
    if (body.assignedAdminId && !Types.ObjectId.isValid(String(body.assignedAdminId))) throw new BadRequestError("Invalid assigned admin id");
    if (body.assignedAdminId && !(await Admin.exists({ _id: body.assignedAdminId }))) throw new NotFoundError("Assigned admin not found");
    request.assignedAdminId = body.assignedAdminId || undefined;
  }
  if (body.assignedTeam !== undefined) request.assignedTeam = body.assignedTeam || undefined;
  if (body.escalated) request.escalatedAt = new Date();
  if (body.resolution !== undefined) request.resolution = body.resolution;
  if (request.status === SupportRequestStatus.resolved) {
    if (!body.resolution && !request.resolution) throw new BadRequestError("A resolution is required to resolve a request");
    request.resolvedAt = new Date();
    if (request.jobId && request.milestoneId) {
      const job: any = await Jobs.findById(request.jobId);
      const milestone = job?.milestones?.find((item: any) => String(item._id) === String(request.milestoneId));
      if (milestone?.invoice) {
        milestone.invoice.disputeStatus = "resolved";
        job.markModified("milestones");
        await job.save();
      }
    }
  } else if (previousStatus === SupportRequestStatus.resolved) {
    request.resolvedAt = undefined;
    if (request.jobId && request.milestoneId) {
      const job: any = await Jobs.findById(request.jobId);
      const milestone = job?.milestones?.find((item: any) => String(item._id) === String(request.milestoneId));
      if (milestone?.invoice) {
        milestone.invoice.disputeStatus = "open";
        job.markModified("milestones");
        await job.save();
      }
    }
  }
  request.history.push({
    adminId,
    action: body.status === SupportRequestStatus.resolved ? "resolved" : body.escalated ? "escalated" : body.assignedAdminId !== undefined || body.assignedTeam !== undefined ? "assigned" : body.priority ? "priority_updated" : "updated",
    note: body.note || body.resolution,
    fromStatus: previousStatus,
    toStatus: request.status,
  });
  await request.save();
  return fetchSupportRequest(requestId);
};

export const resolveSupportRequest = (requestId: string, adminId: string, resolution: string) =>
  updateSupportRequest(requestId, adminId, { status: SupportRequestStatus.resolved, resolution, note: resolution });

export const assignSupportRequest = (requestId: string, adminId: string, body: any) =>
  updateSupportRequest(requestId, adminId, body);

export const replyToSupportRequest = async (requestId: string, adminId: string, body: any) => {
  assertId(requestId, "support request id");
  const request: any = await SupportRequest.findById(requestId);
  if (!request) throw new NotFoundError("Support request not found");
  if (isResolved(request.status)) throw new BadRequestError("Resolved tickets cannot receive a reply");
  request.messages.push({ senderType: "admin", senderAdminId: adminId, content: body.message, attachments: body.attachments || [] });
  request.lastMessageAt = new Date();
  request.status = SupportRequestStatus.pendingCustomer;
  request.history.push({ adminId, action: "replied", note: body.message.slice(0, 500), toStatus: request.status });
  await request.save();
  return fetchSupportRequest(requestId);
};

export const customerReplyToSupportRequest = async (requestId: string, requesterId: string, body: any) => {
  assertId(requestId, "support request id");
  const request: any = await SupportRequest.findOne({ _id: requestId, requesterId });
  if (!request) throw new NotFoundError("Support request not found");
  if (isResolved(request.status)) throw new BadRequestError("Resolved tickets cannot receive a reply");
  request.messages.push({ senderType: "customer", senderUserId: requesterId, content: body.message, attachments: body.attachments || [] });
  request.lastMessageAt = new Date();
  request.status = SupportRequestStatus.inProgress;
  request.history.push({ action: "customer_replied", note: body.message.slice(0, 500), toStatus: request.status });
  await request.save();
  return fetchSupportRequest(requestId);
};

export const addSupportAdminNote = async (requestId: string, adminId: string, content: string) => {
  assertId(requestId, "support request id");
  const request: any = await SupportRequest.findById(requestId);
  if (!request) throw new NotFoundError("Support request not found");
  request.adminNotes.push({ adminId, content });
  request.history.push({ adminId, action: "note_added", note: content.slice(0, 500) });
  await request.save();
  return fetchSupportRequest(requestId);
};

export const fetchSupportAssignees = async () => {
  const admins = await Admin.find({ status: "Active" }).select("fullName email department role").sort({ fullName: 1 }).lean();
  const teams = await SupportRequest.distinct("assignedTeam", { assignedTeam: { $exists: true, $nin: [null, ""] } });
  return { admins, teams: [...new Set(["Operations", "Finance Team", "Trust & Safety", ...teams])].sort() };
};

export const countUnresolvedSupportRequests = () =>
  SupportRequest.countDocuments({ status: { $ne: SupportRequestStatus.resolved } });
