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

export const fetchSupportSummary = async (now = new Date()) => {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const cutoff = overdueCutoff(now);
  const unresolved = { status: { $ne: SupportRequestStatus.resolved } };
  const [unassignedTickets, highPriorityTickets, overdueTickets, pendingTickets, resolutionRows] = await Promise.all([
    SupportRequest.countDocuments({ ...unresolved, assignedAdminId: { $exists: false }, assignedTeam: { $in: [null, ""] } }),
    SupportRequest.countDocuments({ ...unresolved, priority: { $in: [SupportRequestPriority.high, SupportRequestPriority.critical, SupportRequestPriority.urgent] } }),
    SupportRequest.countDocuments({ ...unresolved, createdAt: { $lt: cutoff } }),
    SupportRequest.countDocuments({ status: SupportRequestStatus.pendingCustomer }),
    SupportRequest.aggregate([
      { $match: { status: SupportRequestStatus.resolved, resolvedAt: { $gte: weekAgo, $lte: now } } },
      { $project: { duration: { $subtract: ["$resolvedAt", "$createdAt"] } } },
      { $group: { _id: null, averageMilliseconds: { $avg: "$duration" }, count: { $sum: 1 } } },
    ]),
  ]);
  const averageResolutionSeconds = Math.round((resolutionRows[0]?.averageMilliseconds || 0) / 1000);
  return {
    ticketCount: await SupportRequest.countDocuments(),
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

  const [requests, total, statusRows, overdue] = await Promise.all([
    SupportRequest.find(filter)
      .populate("requesterId", "firstName lastName userName email uniqueId displayImage")
      .populate("assignedAdminId", "fullName email department")
      .populate("jobId", "title status userId")
      .sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    SupportRequest.countDocuments(filter),
    SupportRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    SupportRequest.countDocuments({ status: { $ne: SupportRequestStatus.resolved }, createdAt: { $lt: cutoff } }),
  ]);
  return {
    requests: requests.map((request: any) => displayRequest(request)),
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
