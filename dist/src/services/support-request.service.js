"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countUnresolvedSupportRequests = exports.fetchSupportAssignees = exports.addSupportAdminNote = exports.customerReplyToSupportRequest = exports.replyToSupportRequest = exports.assignSupportRequest = exports.resolveSupportRequest = exports.updateSupportRequest = exports.fetchSupportRequest = exports.fetchSupportRequests = exports.fetchSupportSummary = exports.fetchUserSupportRequest = exports.fetchUserSupportRequests = exports.createInvoiceDispute = exports.invoiceDisputeMilestone = exports.INVOICE_NON_PAYMENT_GRACE_DAYS = exports.createSupportRequest = exports.supportPagination = void 0;
const mongoose_1 = require("mongoose");
const error_1 = require("../errors/error");
const support_enum_1 = require("../enums/support.enum");
const support_request_model_1 = __importDefault(require("../models/support-request.model"));
const admin_model_1 = __importDefault(require("../models/admin.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const jobs_enum_1 = require("../enums/jobs.enum");
const project_model_1 = __importDefault(require("../models/project.model"));
const supportPagination = (pageValue, limitValue) => {
    const page = Math.max(1, Number(pageValue) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
    return { page, limit, skip: (page - 1) * limit };
};
exports.supportPagination = supportPagination;
const assertId = (value, label) => {
    if (!mongoose_1.Types.ObjectId.isValid(value))
        throw new error_1.BadRequestError(`Invalid ${label}`);
};
const createSupportRequest = async (requesterId, body) => {
    assertId(requesterId, "requester id");
    const request = await support_request_model_1.default.create({
        ...body,
        requesterId,
        lastMessageAt: new Date(),
        messages: [{ senderType: "customer", senderUserId: requesterId, content: body.description, attachments: body.attachments || [] }],
    });
    request.history.push({ action: "created", note: "Support ticket created" });
    await request.save();
    return (0, exports.fetchSupportRequest)(String(request._id));
};
exports.createSupportRequest = createSupportRequest;
exports.INVOICE_NON_PAYMENT_GRACE_DAYS = 7;
const invoiceDisputeMilestone = (job, requesterId, milestoneId, invoiceId, disputeType = support_enum_1.InvoiceDisputeType.ownerUnsatisfiedWork, acceptedArtisanId, now = new Date()) => {
    const isOwner = String(job.userId?._id || job.userId) === String(requesterId);
    const isArtisan = Boolean(acceptedArtisanId) && String(acceptedArtisanId) === String(requesterId);
    if (!isOwner && !isArtisan)
        throw new error_1.ForbiddenError("Only the job owner or accepted artisan can dispute this invoice");
    const milestone = (job.milestones || []).find((item) => String(item._id) === String(milestoneId));
    if (!milestone)
        throw new error_1.NotFoundError("Milestone not found");
    if (!milestone.invoice?.invoiceRaised || !milestone.invoice?.invoiceId) {
        throw new error_1.BadRequestError("No invoice has been raised for this milestone");
    }
    if (milestone.paymentStatus === jobs_enum_1.MilestonePaymentStatus.processing) {
        throw new error_1.BadRequestError("The invoice payment is currently being processed");
    }
    if (invoiceId && String(milestone.invoice.invoiceId) !== String(invoiceId)) {
        throw new error_1.BadRequestError("Invoice does not belong to this milestone");
    }
    const ownerTypes = [support_enum_1.InvoiceDisputeType.ownerUnsatisfiedWork, support_enum_1.InvoiceDisputeType.ownerAdditionalCostReason];
    const artisanTypes = [support_enum_1.InvoiceDisputeType.artisanAdditionalCostUnpaid, support_enum_1.InvoiceDisputeType.artisanInvoiceUnpaidOverdue];
    if (isOwner && !ownerTypes.includes(disputeType))
        throw new error_1.ForbiddenError("This dispute type is only available to the artisan");
    if (isArtisan && !artisanTypes.includes(disputeType))
        throw new error_1.ForbiddenError("This dispute type is only available to the job owner");
    const originalAmount = Number(milestone.amount || 0);
    const additionalAmount = Math.max(0, Number(milestone.invoice.additionalAmount || 0));
    const amountPaid = Math.max(0, Number(milestone.paymentInfo?.amountPaid || 0));
    if (disputeType === support_enum_1.InvoiceDisputeType.ownerAdditionalCostReason && additionalAmount <= 0) {
        throw new error_1.BadRequestError("This invoice does not contain an additional cost");
    }
    if (disputeType === support_enum_1.InvoiceDisputeType.artisanAdditionalCostUnpaid) {
        if (additionalAmount <= 0)
            throw new error_1.BadRequestError("This invoice does not contain an additional cost");
        if (amountPaid <= 0)
            throw new error_1.BadRequestError("The original invoice payment has not been made yet");
        if (amountPaid >= originalAmount + additionalAmount)
            throw new error_1.BadRequestError("The additional cost has already been paid");
    }
    if (disputeType === support_enum_1.InvoiceDisputeType.artisanInvoiceUnpaidOverdue) {
        if (milestone.paymentStatus === jobs_enum_1.MilestonePaymentStatus.paid)
            throw new error_1.BadRequestError("This invoice has already been paid");
        if (!milestone.invoice.issuedAt)
            throw new error_1.BadRequestError("Invoice issue date is unavailable");
        const eligibleAt = new Date(milestone.invoice.issuedAt);
        eligibleAt.setDate(eligibleAt.getDate() + exports.INVOICE_NON_PAYMENT_GRACE_DAYS);
        if (now < eligibleAt) {
            throw new error_1.BadRequestError(`The invoice must remain unpaid for ${exports.INVOICE_NON_PAYMENT_GRACE_DAYS} days before a dispute can be raised`);
        }
    }
    return { milestone, raisedByRole: isOwner ? "job_owner" : "artisan" };
};
exports.invoiceDisputeMilestone = invoiceDisputeMilestone;
const createInvoiceDispute = async (requesterId, body) => {
    assertId(requesterId, "requester id");
    assertId(body.jobId, "job id");
    assertId(body.milestoneId, "milestone id");
    const job = await jobs_model_1.default.findById(body.jobId);
    if (!job)
        throw new error_1.NotFoundError("Job not found");
    const acceptedProject = job.acceptedApplicationId
        ? await project_model_1.default.findById(job.acceptedApplicationId).select("user").lean()
        : null;
    const { milestone, raisedByRole } = (0, exports.invoiceDisputeMilestone)(job, requesterId, body.milestoneId, body.invoiceId, body.disputeType, acceptedProject?.user ? String(acceptedProject.user) : undefined);
    const existing = await support_request_model_1.default.findOne({
        jobId: job._id,
        milestoneId: milestone._id,
        category: support_enum_1.SupportRequestCategory.dispute,
        status: { $ne: support_enum_1.SupportRequestStatus.resolved },
    });
    if (existing) {
        throw new error_1.BadRequestError(`An open dispute already exists for this invoice (${existing.ticketCode || existing._id})`);
    }
    const request = await support_request_model_1.default.create({
        requesterId,
        subject: body.subject || `Invoice dispute: ${job.title || "Job invoice"}`,
        description: body.reason,
        category: support_enum_1.SupportRequestCategory.dispute,
        priority: support_enum_1.SupportRequestPriority.high,
        status: support_enum_1.SupportRequestStatus.open,
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
    return (0, exports.fetchSupportRequest)(String(request._id));
};
exports.createInvoiceDispute = createInvoiceDispute;
const fetchUserSupportRequests = async (requesterId, query) => {
    assertId(requesterId, "requester id");
    const { page, limit, skip } = (0, exports.supportPagination)(query.page, query.limit);
    const filter = { requesterId };
    if (query.status)
        filter.status = query.status;
    if (query.category)
        filter.category = query.category;
    const [requests, total] = await Promise.all([
        support_request_model_1.default.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
        support_request_model_1.default.countDocuments(filter),
    ]);
    return { requests: requests.map((request) => displayRequest(request)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};
exports.fetchUserSupportRequests = fetchUserSupportRequests;
const fetchUserSupportRequest = async (requesterId, requestId) => {
    assertId(requesterId, "requester id");
    assertId(requestId, "support request id");
    const request = await support_request_model_1.default.findOne({ _id: requestId, requesterId })
        .populate("messages.senderAdminId", "fullName department profileImage")
        .populate("messages.senderUserId", "firstName lastName userName displayImage")
        .lean();
    if (!request)
        throw new error_1.NotFoundError("Support request not found");
    return displayRequest(request);
};
exports.fetchUserSupportRequest = fetchUserSupportRequest;
const SLA_HOURS = 24;
const overdueCutoff = (now = new Date()) => new Date(now.getTime() - SLA_HOURS * 60 * 60 * 1000);
const isResolved = (status) => status === support_enum_1.SupportRequestStatus.resolved;
const elapsedSeconds = (from, to = new Date()) => Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
const displayRequest = (request, now = new Date()) => {
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
const fetchSupportSummary = async (now = new Date()) => {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoff = overdueCutoff(now);
    const unresolved = { status: { $ne: support_enum_1.SupportRequestStatus.resolved } };
    const [unassignedTickets, highPriorityTickets, overdueTickets, pendingTickets, resolutionRows] = await Promise.all([
        support_request_model_1.default.countDocuments({ ...unresolved, assignedAdminId: { $exists: false }, assignedTeam: { $in: [null, ""] } }),
        support_request_model_1.default.countDocuments({ ...unresolved, priority: { $in: [support_enum_1.SupportRequestPriority.high, support_enum_1.SupportRequestPriority.critical, support_enum_1.SupportRequestPriority.urgent] } }),
        support_request_model_1.default.countDocuments({ ...unresolved, createdAt: { $lt: cutoff } }),
        support_request_model_1.default.countDocuments({ status: support_enum_1.SupportRequestStatus.pendingCustomer }),
        support_request_model_1.default.aggregate([
            { $match: { status: support_enum_1.SupportRequestStatus.resolved, resolvedAt: { $gte: weekAgo, $lte: now } } },
            { $project: { duration: { $subtract: ["$resolvedAt", "$createdAt"] } } },
            { $group: { _id: null, averageMilliseconds: { $avg: "$duration" }, count: { $sum: 1 } } },
        ]),
    ]);
    const averageResolutionSeconds = Math.round((resolutionRows[0]?.averageMilliseconds || 0) / 1000);
    return {
        ticketCount: await support_request_model_1.default.countDocuments(),
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
exports.fetchSupportSummary = fetchSupportSummary;
const fetchSupportRequests = async (query) => {
    const { page, limit, skip } = (0, exports.supportPagination)(query.page, query.limit);
    const filter = {};
    const cutoff = overdueCutoff();
    if (query.status === "overdue") {
        filter.status = { $ne: support_enum_1.SupportRequestStatus.resolved };
        filter.createdAt = { $lt: cutoff };
    }
    else if (query.status === "pending") {
        filter.status = { $ne: support_enum_1.SupportRequestStatus.resolved };
    }
    else if (query.status)
        filter.status = query.status;
    if (query.priority)
        filter.priority = query.priority;
    if (query.category)
        filter.category = query.category;
    if (query.team)
        filter.assignedTeam = String(query.team);
    if (query.assignedAdminId === "unassigned") {
        filter.assignedAdminId = { $exists: false };
        filter.assignedTeam = { $in: [null, ""] };
    }
    else if (query.assignedAdminId && mongoose_1.Types.ObjectId.isValid(String(query.assignedAdminId))) {
        filter.assignedAdminId = query.assignedAdminId;
    }
    if (query.search) {
        const search = String(query.search).trim();
        filter.$or = [
            { ticketCode: { $regex: search, $options: "i" } },
            { subject: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
        if (mongoose_1.Types.ObjectId.isValid(search))
            filter.$or.push({ requesterId: new mongoose_1.Types.ObjectId(search) });
        const users = await users_model_1.default.find({
            $or: [
                { firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } },
                { userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } },
            ],
        }).select("_id").lean();
        if (users.length)
            filter.$or.push({ requesterId: { $in: users.map((user) => user._id) } });
    }
    const [requests, total, statusRows] = await Promise.all([
        support_request_model_1.default.find(filter)
            .populate("requesterId", "firstName lastName userName email uniqueId displayImage")
            .populate("assignedAdminId", "fullName email department")
            .populate("jobId", "title status userId")
            .sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
        support_request_model_1.default.countDocuments(filter),
        support_request_model_1.default.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);
    const counts = Object.fromEntries(statusRows.map((row) => [row._id, row.count]));
    return {
        requests: requests.map((request) => displayRequest(request)),
        counts: {
            open: counts[support_enum_1.SupportRequestStatus.open] || 0,
            inProgress: counts[support_enum_1.SupportRequestStatus.inProgress] || 0,
            pendingCustomer: counts[support_enum_1.SupportRequestStatus.pendingCustomer] || 0,
            pendingResolution: counts[support_enum_1.SupportRequestStatus.pendingResolution] || 0,
            resolved: counts[support_enum_1.SupportRequestStatus.resolved] || 0,
            overdue: await support_request_model_1.default.countDocuments({ status: { $ne: support_enum_1.SupportRequestStatus.resolved }, createdAt: { $lt: cutoff } }),
        },
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};
exports.fetchSupportRequests = fetchSupportRequests;
const fetchSupportRequest = async (requestId) => {
    assertId(requestId, "support request id");
    const request = await support_request_model_1.default.findById(requestId)
        .populate("requesterId", "firstName lastName userName email uniqueId displayImage status")
        .populate("assignedAdminId", "fullName email department")
        .populate("jobId", "title status userId")
        .populate("history.adminId", "fullName email department")
        .populate("messages.senderAdminId", "fullName email department profileImage")
        .populate("messages.senderUserId", "firstName lastName userName email displayImage")
        .populate("adminNotes.adminId", "fullName email department")
        .lean();
    if (!request)
        throw new error_1.NotFoundError("Support request not found");
    return displayRequest(request);
};
exports.fetchSupportRequest = fetchSupportRequest;
const updateSupportRequest = async (requestId, adminId, body) => {
    assertId(requestId, "support request id");
    const request = await support_request_model_1.default.findById(requestId);
    if (!request)
        throw new error_1.NotFoundError("Support request not found");
    const previousStatus = request.status;
    if (body.status)
        request.status = body.status;
    if (body.priority)
        request.priority = body.priority;
    if (body.assignedAdminId !== undefined) {
        if (body.assignedAdminId && !mongoose_1.Types.ObjectId.isValid(String(body.assignedAdminId)))
            throw new error_1.BadRequestError("Invalid assigned admin id");
        if (body.assignedAdminId && !(await admin_model_1.default.exists({ _id: body.assignedAdminId })))
            throw new error_1.NotFoundError("Assigned admin not found");
        request.assignedAdminId = body.assignedAdminId || undefined;
    }
    if (body.assignedTeam !== undefined)
        request.assignedTeam = body.assignedTeam || undefined;
    if (body.escalated)
        request.escalatedAt = new Date();
    if (body.resolution !== undefined)
        request.resolution = body.resolution;
    if (request.status === support_enum_1.SupportRequestStatus.resolved) {
        if (!body.resolution && !request.resolution)
            throw new error_1.BadRequestError("A resolution is required to resolve a request");
        request.resolvedAt = new Date();
        if (request.jobId && request.milestoneId) {
            const job = await jobs_model_1.default.findById(request.jobId);
            const milestone = job?.milestones?.find((item) => String(item._id) === String(request.milestoneId));
            if (milestone?.invoice) {
                milestone.invoice.disputeStatus = "resolved";
                job.markModified("milestones");
                await job.save();
            }
        }
    }
    else if (previousStatus === support_enum_1.SupportRequestStatus.resolved) {
        request.resolvedAt = undefined;
        if (request.jobId && request.milestoneId) {
            const job = await jobs_model_1.default.findById(request.jobId);
            const milestone = job?.milestones?.find((item) => String(item._id) === String(request.milestoneId));
            if (milestone?.invoice) {
                milestone.invoice.disputeStatus = "open";
                job.markModified("milestones");
                await job.save();
            }
        }
    }
    request.history.push({
        adminId,
        action: body.status === support_enum_1.SupportRequestStatus.resolved ? "resolved" : body.escalated ? "escalated" : body.assignedAdminId !== undefined || body.assignedTeam !== undefined ? "assigned" : body.priority ? "priority_updated" : "updated",
        note: body.note || body.resolution,
        fromStatus: previousStatus,
        toStatus: request.status,
    });
    await request.save();
    return (0, exports.fetchSupportRequest)(requestId);
};
exports.updateSupportRequest = updateSupportRequest;
const resolveSupportRequest = (requestId, adminId, resolution) => (0, exports.updateSupportRequest)(requestId, adminId, { status: support_enum_1.SupportRequestStatus.resolved, resolution, note: resolution });
exports.resolveSupportRequest = resolveSupportRequest;
const assignSupportRequest = (requestId, adminId, body) => (0, exports.updateSupportRequest)(requestId, adminId, body);
exports.assignSupportRequest = assignSupportRequest;
const replyToSupportRequest = async (requestId, adminId, body) => {
    assertId(requestId, "support request id");
    const request = await support_request_model_1.default.findById(requestId);
    if (!request)
        throw new error_1.NotFoundError("Support request not found");
    if (isResolved(request.status))
        throw new error_1.BadRequestError("Resolved tickets cannot receive a reply");
    request.messages.push({ senderType: "admin", senderAdminId: adminId, content: body.message, attachments: body.attachments || [] });
    request.lastMessageAt = new Date();
    request.status = support_enum_1.SupportRequestStatus.pendingCustomer;
    request.history.push({ adminId, action: "replied", note: body.message.slice(0, 500), toStatus: request.status });
    await request.save();
    return (0, exports.fetchSupportRequest)(requestId);
};
exports.replyToSupportRequest = replyToSupportRequest;
const customerReplyToSupportRequest = async (requestId, requesterId, body) => {
    assertId(requestId, "support request id");
    const request = await support_request_model_1.default.findOne({ _id: requestId, requesterId });
    if (!request)
        throw new error_1.NotFoundError("Support request not found");
    if (isResolved(request.status))
        throw new error_1.BadRequestError("Resolved tickets cannot receive a reply");
    request.messages.push({ senderType: "customer", senderUserId: requesterId, content: body.message, attachments: body.attachments || [] });
    request.lastMessageAt = new Date();
    request.status = support_enum_1.SupportRequestStatus.inProgress;
    request.history.push({ action: "customer_replied", note: body.message.slice(0, 500), toStatus: request.status });
    await request.save();
    return (0, exports.fetchSupportRequest)(requestId);
};
exports.customerReplyToSupportRequest = customerReplyToSupportRequest;
const addSupportAdminNote = async (requestId, adminId, content) => {
    assertId(requestId, "support request id");
    const request = await support_request_model_1.default.findById(requestId);
    if (!request)
        throw new error_1.NotFoundError("Support request not found");
    request.adminNotes.push({ adminId, content });
    request.history.push({ adminId, action: "note_added", note: content.slice(0, 500) });
    await request.save();
    return (0, exports.fetchSupportRequest)(requestId);
};
exports.addSupportAdminNote = addSupportAdminNote;
const fetchSupportAssignees = async () => {
    const admins = await admin_model_1.default.find({ status: "Active" }).select("fullName email department role").sort({ fullName: 1 }).lean();
    const teams = await support_request_model_1.default.distinct("assignedTeam", { assignedTeam: { $exists: true, $nin: [null, ""] } });
    return { admins, teams: [...new Set(["Operations", "Finance Team", "Trust & Safety", ...teams])].sort() };
};
exports.fetchSupportAssignees = fetchSupportAssignees;
const countUnresolvedSupportRequests = () => support_request_model_1.default.countDocuments({ status: { $ne: support_enum_1.SupportRequestStatus.resolved } });
exports.countUnresolvedSupportRequests = countUnresolvedSupportRequests;
