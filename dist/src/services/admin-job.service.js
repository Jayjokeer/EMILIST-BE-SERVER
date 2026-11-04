"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyAdminJobAction = exports.adminJobActionsForStatus = exports.fetchAdminJobPayment = exports.fetchAdminJobPayments = exports.fetchAdminJobInvoice = exports.fetchAdminJobInvoices = exports.fetchAdminJobApplicants = exports.fetchAdminJobDetails = exports.fetchAdminJobs = exports.fetchAdminJobSummary = exports.jobDisplayStatus = exports.adminJobPagination = void 0;
const mongoose_1 = require("mongoose");
const error_1 = require("../errors/error");
const jobs_enum_1 = require("../enums/jobs.enum");
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const project_model_1 = __importDefault(require("../models/project.model"));
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const review_model_1 = __importDefault(require("../models/review.model"));
const admin_action_model_1 = __importDefault(require("../models/admin-action.model"));
const transaction_enum_1 = require("../enums/transaction.enum");
const adminJobPagination = (pageValue, limitValue) => {
    const page = Math.max(1, Number(pageValue) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
    return { page, limit, skip: (page - 1) * limit };
};
exports.adminJobPagination = adminJobPagination;
const jobDisplayStatus = (job) => !job.isListed && job.status === jobs_enum_1.JobStatusEnum.listed
    ? jobs_enum_1.JobStatusEnum.draft
    : job.status;
exports.jobDisplayStatus = jobDisplayStatus;
const assertJobId = (jobId) => {
    if (!mongoose_1.Types.ObjectId.isValid(jobId))
        throw new error_1.BadRequestError("Invalid job id");
};
const amountFor = (job) => job.totalBudget?.amount ?? job.estimatedBudget?.amount
    ?? job.recurringBudget?.amount ?? job.maximumPrice ?? job.budget ?? 0;
const currencyFor = (job) => job.totalBudget?.currency ?? job.estimatedBudget?.currency
    ?? job.recurringBudget?.currency ?? job.currency ?? "NGN";
const durationFor = (job) => job.jobDuration
    ? `${job.jobDuration.value} ${job.jobDuration.unit}`
    : job.duration?.number ? `${job.duration.number} ${job.duration.period}` : null;
const fetchAdminJobSummary = async () => {
    const [rows, applicants] = await Promise.all([
        jobs_model_1.default.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        project_model_1.default.countDocuments(),
    ]);
    const counts = Object.fromEntries(rows.map((row) => [row._id, row.count]));
    return {
        total: rows.reduce((sum, row) => sum + row.count, 0),
        active: counts[jobs_enum_1.JobStatusEnum.active] || 0,
        applicants,
        overdue: counts[jobs_enum_1.JobStatusEnum.overdue] || 0,
        paused: counts[jobs_enum_1.JobStatusEnum.paused] || 0,
        completed: counts[jobs_enum_1.JobStatusEnum.complete] || 0,
    };
};
exports.fetchAdminJobSummary = fetchAdminJobSummary;
const fetchAdminJobs = async (query) => {
    const { page, limit, skip } = (0, exports.adminJobPagination)(query.page, query.limit);
    const filter = {};
    if (query.status) {
        if (query.status === jobs_enum_1.JobStatusEnum.draft) {
            filter.$or = [{ status: jobs_enum_1.JobStatusEnum.draft }, { status: jobs_enum_1.JobStatusEnum.listed, isListed: false }];
        }
        else
            filter.status = query.status;
    }
    const search = String(query.search || "").trim();
    if (search) {
        const users = await users_model_1.default.find({ $or: [
                { firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } },
                { userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } },
            ] }).select("_id").lean();
        const searchFilter = { $or: [
                { title: { $regex: search, $options: "i" } },
                { expertId: { $regex: search, $options: "i" } },
                { userId: { $in: users.map((user) => user._id) } },
                ...(mongoose_1.Types.ObjectId.isValid(search) ? [{ _id: new mongoose_1.Types.ObjectId(search) }] : []),
            ] };
        filter.$and = [...(filter.$and || []), searchFilter];
    }
    const [jobs, total] = await Promise.all([
        jobs_model_1.default.find(filter).populate("userId", "firstName lastName userName uniqueId email")
            .populate({ path: "acceptedApplicationId", select: "user businessId", populate: [
                { path: "user", select: "userName uniqueId" }, { path: "businessId", select: "businessName uniqueId" },
            ] }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        jobs_model_1.default.countDocuments(filter),
    ]);
    return {
        jobs: jobs.map((job) => ({
            id: job._id, createdAt: job.createdAt, title: job.title,
            postedBy: job.userId, duration: durationFor(job), budget: amountFor(job), currency: currencyFor(job),
            applicants: job.applications?.length || 0,
            expert: job.acceptedApplicationId?.businessId || job.acceptedApplicationId?.user || null,
            status: (0, exports.jobDisplayStatus)(job), isListed: job.isListed,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};
exports.fetchAdminJobs = fetchAdminJobs;
const fetchJob = async (jobId) => {
    assertJobId(jobId);
    const job = await jobs_model_1.default.findById(jobId).populate("userId", "firstName lastName userName uniqueId displayImage email")
        .populate({ path: "acceptedApplicationId", populate: [
            { path: "user", select: "firstName lastName userName uniqueId displayImage level" },
            { path: "businessId", select: "businessName uniqueId displayImage startingPrice rateUnit currency businessImages reviews services businessDescription address city state country" },
        ] }).lean();
    if (!job)
        throw new error_1.NotFoundError("Job not found");
    return job;
};
const fetchAdminJobDetails = async (jobId) => {
    const job = await fetchJob(jobId);
    const status = (0, exports.jobDisplayStatus)(job);
    return {
        ...job,
        status,
        availableActions: (0, exports.adminJobActionsForStatus)(status),
        displayBudget: { amount: amountFor(job), currency: currencyFor(job) },
        displayDuration: durationFor(job),
        applicantsCount: job.applications?.length || 0,
    };
};
exports.fetchAdminJobDetails = fetchAdminJobDetails;
const fetchAdminJobApplicants = async (jobId, query) => {
    await fetchJob(jobId);
    const { page, limit, skip } = (0, exports.adminJobPagination)(query.page, query.limit);
    const filter = { job: jobId };
    if (query.status)
        filter.status = query.status;
    const [applications, total] = await Promise.all([
        project_model_1.default.find(filter).populate("user", "firstName lastName userName uniqueId displayImage level")
            .populate("businessId", "businessName uniqueId displayImage startingPrice rateUnit currency address city state country services reviews businessImages businessDescription")
            .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        project_model_1.default.countDocuments(filter),
    ]);
    const businessIds = applications.map((item) => item.businessId?._id).filter(Boolean);
    const ratingRows = businessIds.length ? await review_model_1.default.aggregate([
        { $match: { businessId: { $in: businessIds } } },
        { $group: { _id: "$businessId", rating: { $avg: "$rating" }, reviews: { $sum: 1 } } },
    ]) : [];
    const ratings = new Map(ratingRows.map((row) => [String(row._id), row]));
    return {
        applications: applications.map((item) => ({
            ...item,
            rating: ratings.get(String(item.businessId?._id))?.rating || 0,
            reviewCount: ratings.get(String(item.businessId?._id))?.reviews || 0,
        })),
        hiredApplicationId: jobId && String((await jobs_model_1.default.findById(jobId).select("acceptedApplicationId").lean())?.acceptedApplicationId || "") || null,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};
exports.fetchAdminJobApplicants = fetchAdminJobApplicants;
const fetchAdminJobInvoices = async (jobId) => {
    const job = await fetchJob(jobId);
    const invoices = (job.milestones || []).filter((item) => item.invoice?.invoiceRaised).map((item, index) => ({
        id: item.invoice.invoiceId || item._id,
        number: String(item.invoice.invoiceId || item._id),
        title: `Invoice ${index + 1}`,
        tag: item.achievement || `Milestone ${index + 1}`,
        issuedAt: item.invoice.issuedAt,
        dueAt: item.timeFrame?.date || null,
        subtotal: (item.amount || 0) + (item.invoice.additionalAmount || 0),
        currency: item.currency || job.currency || "NGN",
        status: item.paymentStatus === jobs_enum_1.MilestonePaymentStatus.paid ? "paid" : item.invoice.reviewStatus || "unpaid",
        note: item.invoice.note,
    }));
    return {
        invoices,
        log: {
            total: invoices.length,
            milestone: invoices.filter((item) => !String(item.tag).toLowerCase().includes("additional")).length,
            additional: invoices.filter((item) => String(item.tag).toLowerCase().includes("additional")).length,
            paid: invoices.filter((item) => item.status === "paid").length,
            pending: invoices.filter((item) => item.status !== "paid").length,
            overdue: invoices.filter((item) => item.dueAt && new Date(item.dueAt) < new Date() && item.status !== "paid").length,
        },
        totalPayable: invoices.reduce((sum, item) => sum + item.subtotal, 0),
    };
};
exports.fetchAdminJobInvoices = fetchAdminJobInvoices;
const fetchAdminJobInvoice = async (jobId, invoiceId) => {
    const data = await (0, exports.fetchAdminJobInvoices)(jobId);
    const invoice = data.invoices.find((item) => String(item.id) === invoiceId || item.number === invoiceId);
    if (!invoice)
        throw new error_1.NotFoundError("Job invoice not found");
    return invoice;
};
exports.fetchAdminJobInvoice = fetchAdminJobInvoice;
const fetchAdminJobPayments = async (jobId) => {
    const job = await fetchJob(jobId);
    const payments = await transaction_model_1.default.find({ jobId }).populate("recieverId", "firstName lastName userName")
        .sort({ createdAt: -1 }).lean();
    const rows = payments.map((payment) => ({
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
            paid: rows.filter((row) => row.status === transaction_enum_1.TransactionEnum.completed).length,
            pending: rows.filter((row) => [transaction_enum_1.TransactionEnum.pending, transaction_enum_1.TransactionEnum.processing].includes(row.status)).length,
            overdue: (job.milestones || []).filter((item) => item.status === "overdue" && item.paymentStatus !== jobs_enum_1.MilestonePaymentStatus.paid).length,
        },
        completedAmount: rows.filter((row) => row.status === transaction_enum_1.TransactionEnum.completed).reduce((sum, row) => sum + row.amount, 0),
        upcomingAmount: (job.milestones || []).filter((item) => item.paymentStatus !== jobs_enum_1.MilestonePaymentStatus.paid)
            .reduce((sum, item) => sum + (item.amount || 0), 0),
    };
};
exports.fetchAdminJobPayments = fetchAdminJobPayments;
const fetchAdminJobPayment = async (jobId, paymentId) => {
    if (!mongoose_1.Types.ObjectId.isValid(paymentId))
        throw new error_1.BadRequestError("Invalid payment id");
    await fetchJob(jobId);
    const payment = await transaction_model_1.default.findOne({ _id: paymentId, jobId })
        .populate("userId", "firstName lastName userName email")
        .populate("recieverId", "firstName lastName userName email")
        .lean();
    if (!payment)
        throw new error_1.NotFoundError("Job payment not found");
    return payment;
};
exports.fetchAdminJobPayment = fetchAdminJobPayment;
const allowedActions = {
    [jobs_enum_1.AdminJobActionEnum.approveListing]: [jobs_enum_1.JobStatusEnum.listed],
    [jobs_enum_1.AdminJobActionEnum.rejectListing]: [jobs_enum_1.JobStatusEnum.listed],
    [jobs_enum_1.AdminJobActionEnum.removeListing]: [jobs_enum_1.JobStatusEnum.draft, jobs_enum_1.JobStatusEnum.in_review],
    [jobs_enum_1.AdminJobActionEnum.pause]: [jobs_enum_1.JobStatusEnum.active],
    [jobs_enum_1.AdminJobActionEnum.resume]: [jobs_enum_1.JobStatusEnum.paused],
    [jobs_enum_1.AdminJobActionEnum.cancel]: [jobs_enum_1.JobStatusEnum.overdue],
    [jobs_enum_1.AdminJobActionEnum.convertToRecurring]: [jobs_enum_1.JobStatusEnum.complete],
};
const adminJobActionsForStatus = (status) => Object.entries(allowedActions).filter(([, statuses]) => statuses.includes(status)).map(([action]) => action);
exports.adminJobActionsForStatus = adminJobActionsForStatus;
const applyAdminJobAction = async (jobId, adminId, body) => {
    assertJobId(jobId);
    const job = await jobs_model_1.default.findById(jobId);
    if (!job)
        throw new error_1.NotFoundError("Job not found");
    const displayedStatus = (0, exports.jobDisplayStatus)(job);
    if (!allowedActions[body.action]?.includes(displayedStatus)) {
        throw new error_1.BadRequestError(`${body.action} is not allowed while the job is ${displayedStatus}`);
    }
    const previousState = { status: job.status, isListed: job.isListed, jobUrgency: job.jobUrgency };
    switch (body.action) {
        case jobs_enum_1.AdminJobActionEnum.approveListing:
            job.status = jobs_enum_1.JobStatusEnum.listed;
            job.isListed = true;
            break;
        case jobs_enum_1.AdminJobActionEnum.rejectListing:
        case jobs_enum_1.AdminJobActionEnum.removeListing:
            job.status = jobs_enum_1.JobStatusEnum.draft;
            job.isListed = false;
            break;
        case jobs_enum_1.AdminJobActionEnum.pause:
            job.status = jobs_enum_1.JobStatusEnum.paused;
            job.pausedDate = new Date();
            break;
        case jobs_enum_1.AdminJobActionEnum.resume:
            job.status = jobs_enum_1.JobStatusEnum.active;
            job.pausedDate = undefined;
            break;
        case jobs_enum_1.AdminJobActionEnum.cancel:
            job.status = jobs_enum_1.JobStatusEnum.cancelled;
            job.isClosed = true;
            break;
        case jobs_enum_1.AdminJobActionEnum.convertToRecurring:
            job.jobUrgency = "regularly";
            job.jobFrequency = body.frequency;
            job.startDate = body.startDate;
            job.endDate = body.endDate;
            job.recurringBudget = { currency: body.currency, amount: body.amount, period: body.budgetPeriod };
            break;
    }
    job.adminAction = { action: body.action, reason: body.reason, adminId, actedAt: new Date() };
    await job.save();
    await admin_action_model_1.default.create({
        adminId, targetUserId: job.userId || undefined, targetType: "job", targetId: job._id,
        action: `job.${body.action}`, reason: body.reason,
        previousState, newState: { status: job.status, isListed: job.isListed, jobUrgency: job.jobUrgency },
        metadata: { jobId: job._id },
    });
    return (0, exports.fetchAdminJobDetails)(jobId);
};
exports.applyAdminJobAction = applyAdminJobAction;
