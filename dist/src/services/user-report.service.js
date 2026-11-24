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
exports.buildUserReportCsv = exports.upsertUserTarget = exports.fetchUserReport = exports.resolveReportRange = void 0;
const mongoose_1 = require("mongoose");
const error_1 = require("../errors/error");
const jobs_enum_1 = require("../enums/jobs.enum");
const order_enum_1 = require("../enums/order.enum");
const project_enum_1 = require("../enums/project.enum");
const suscribtion_enum_1 = require("../enums/suscribtion.enum");
const transaction_enum_1 = require("../enums/transaction.enum");
const business_model_1 = __importDefault(require("../models/business.model"));
const businessLike_model_1 = __importDefault(require("../models/businessLike.model"));
const joblike_model_1 = __importDefault(require("../models/joblike.model"));
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const productLike_model_1 = __importDefault(require("../models/productLike.model"));
const project_model_1 = __importDefault(require("../models/project.model"));
const promotion_model_1 = __importDefault(require("../models/promotion.model"));
const report_event_model_1 = __importStar(require("../models/report-event.model"));
const target_model_1 = __importDefault(require("../models/target.model"));
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const DAY = 24 * 60 * 60 * 1000;
const endOfUtcDay = (date) => {
    const result = new Date(date);
    result.setUTCHours(23, 59, 59, 999);
    return result;
};
const parseIsoDate = (value, label) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        throw new error_1.BadRequestError(`${label} must use YYYY-MM-DD`);
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new error_1.BadRequestError(`${label} is not a valid calendar date`);
    }
    return date;
};
const resolveReportRange = (query = {}, now = new Date()) => {
    let startDate;
    let endDate;
    let month = null;
    if (query.startDate || query.endDate) {
        if (!query.startDate || !query.endDate)
            throw new error_1.BadRequestError("Both startDate and endDate are required");
        startDate = parseIsoDate(query.startDate, "startDate");
        endDate = endOfUtcDay(parseIsoDate(query.endDate, "endDate"));
    }
    else if (["last7days", "last30days", "last90days"].includes(String(query.range))) {
        const days = Number(String(query.range).match(/\d+/)?.[0] || 30);
        endDate = endOfUtcDay(now);
        startDate = new Date(endDate.getTime() - (days - 1) * DAY);
        startDate.setUTCHours(0, 0, 0, 0);
    }
    else {
        const year = Number(query.year || now.getUTCFullYear());
        if (!Number.isInteger(year) || year < 2000 || year > 2100)
            throw new error_1.BadRequestError("Invalid report year");
        if (query.month !== undefined && query.month !== "") {
            month = Number(query.month);
            if (!Number.isInteger(month) || month < 1 || month > 12)
                throw new error_1.BadRequestError("Month must be between 1 and 12");
            startDate = new Date(Date.UTC(year, month - 1, 1));
            endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        }
        else if (String(query.range) === "year") {
            startDate = new Date(Date.UTC(year, 0, 1));
            endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
        }
        else {
            month = now.getUTCMonth() + 1;
            startDate = new Date(Date.UTC(year, month - 1, 1));
            endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
        }
    }
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
        throw new error_1.BadRequestError("Invalid report date range");
    }
    if (endDate.getTime() - startDate.getTime() > 366 * DAY) {
        throw new error_1.BadRequestError("Report date range cannot exceed 366 days");
    }
    const year = startDate.getUTCFullYear();
    const formatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
    return { startDate, endDate, year, month, label: `${formatter.format(startDate)} - ${formatter.format(endDate)}` };
};
exports.resolveReportRange = resolveReportRange;
const dateFilter = (range, field = "createdAt") => ({ [field]: { $gte: range.startDate, $lte: range.endDate } });
const percent = (value, total) => total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
const ids = (values) => values.map(value => value._id);
const jobSummary = async (userId, range) => {
    const jobs = await jobs_model_1.default.find({ userId, ...dateFilter(range) }).select("status endDate").lean();
    const now = new Date();
    const overdue = jobs.filter(job => job.status === jobs_enum_1.JobStatusEnum.overdue || (job.status === jobs_enum_1.JobStatusEnum.active && job.endDate && new Date(job.endDate) < now)).length;
    const active = jobs.filter(job => job.status === jobs_enum_1.JobStatusEnum.active && !(job.endDate && new Date(job.endDate) < now)).length;
    const pendingStatuses = new Set([jobs_enum_1.JobStatusEnum.draft, jobs_enum_1.JobStatusEnum.listed, jobs_enum_1.JobStatusEnum.pending, jobs_enum_1.JobStatusEnum.in_review]);
    const pending = jobs.filter(job => pendingStatuses.has(job.status)).length;
    const completed = jobs.filter(job => job.status === jobs_enum_1.JobStatusEnum.complete).length;
    const total = jobs.length;
    return { total, active, pending, completed, overdue, distribution: { active: percent(active, total), pending: percent(pending, total), completed: percent(completed, total), overdue: percent(overdue, total) }, hasRecords: total > 0 };
};
const rehireCount = (projects, range, counterpart) => {
    const seen = new Set();
    let rehires = 0;
    projects
        .sort((a, b) => new Date(a.acceptedAt || a.createdAt).getTime() - new Date(b.acceptedAt || b.createdAt).getTime())
        .forEach(project => {
        const key = String(project[counterpart]);
        const acceptedAt = new Date(project.acceptedAt || project.createdAt);
        if (seen.has(key) && acceptedAt >= range.startDate && acceptedAt <= range.endDate)
            rehires += 1;
        seen.add(key);
    });
    return rehires;
};
const applicationSummary = async (userId, range) => {
    const hiredStatuses = [project_enum_1.ProjectStatusEnum.accepted, project_enum_1.ProjectStatusEnum.completed];
    const [received, mine, receivedHireHistory, myHireHistory] = await Promise.all([
        project_model_1.default.find({ creator: userId, ...dateFilter(range, "appliedAt") }).lean(),
        project_model_1.default.find({ user: userId, ...dateFilter(range, "appliedAt") }).lean(),
        project_model_1.default.find({ creator: userId, status: { $in: hiredStatuses }, createdAt: { $lte: range.endDate } }).select("user status acceptedAt createdAt").lean(),
        project_model_1.default.find({ user: userId, status: { $in: hiredStatuses }, createdAt: { $lte: range.endDate } }).select("creator status acceptedAt createdAt").lean(),
    ]);
    const summarize = (projects, rehires) => {
        const hired = projects.filter(project => hiredStatuses.includes(project.status)).length;
        return { total: projects.length, hired, rehired: rehires, flagged: 0, pending: projects.filter(project => [project_enum_1.ProjectStatusEnum.applied, project_enum_1.ProjectStatusEnum.pending, project_enum_1.ProjectStatusEnum.in_review].includes(project.status)).length, rejected: projects.filter(project => project.status === project_enum_1.ProjectStatusEnum.rejected).length };
    };
    return {
        applicants: summarize(received, rehireCount(receivedHireHistory, range, "user")),
        myApplications: summarize(mine, rehireCount(myHireHistory, range, "creator")),
        flaggedTrackingAvailable: false,
    };
};
const completedTransactionDateQuery = (range) => ({
    status: transaction_enum_1.TransactionEnum.completed,
    $or: [
        { dateCompleted: { $gte: range.startDate, $lte: range.endDate } },
        { dateCompleted: { $exists: false }, ...dateFilter(range) },
        { dateCompleted: null, ...dateFilter(range) },
    ],
});
const financialSummary = async (userId, range, currency) => {
    const transactions = await transaction_model_1.default.find({
        currency,
        ...completedTransactionDateQuery(range),
        $and: [{ $or: [{ userId }, { recieverId: userId }] }],
    }).lean();
    const earningCategories = { jobs: 0, materials: 0, referrals: 0, others: 0 };
    const expenseCategories = { jobs: 0, materials: 0, promotions: 0, others: 0 };
    for (const transaction of transactions) {
        if (String(transaction.recieverId) === String(userId)) {
            if (transaction.serviceType === transaction_enum_1.ServiceEnum.job)
                earningCategories.jobs += transaction.amount;
            else if (transaction.serviceType === transaction_enum_1.ServiceEnum.material)
                earningCategories.materials += transaction.amount;
            else
                earningCategories.others += transaction.amount;
        }
        if (String(transaction.userId) === String(userId) && transaction.type === transaction_enum_1.TransactionType.DEBIT) {
            if (transaction.serviceType === transaction_enum_1.ServiceEnum.job)
                expenseCategories.jobs += transaction.amount;
            else if (transaction.serviceType === transaction_enum_1.ServiceEnum.material)
                expenseCategories.materials += transaction.amount;
            else
                expenseCategories.others += transaction.amount;
        }
    }
    const paidPromotions = currency === transaction_enum_1.WalletEnum.NGN
        ? await promotion_model_1.default.find({ userId, paymentStatus: suscribtion_enum_1.PromotionPaymentStatus.paid, createdAt: { $gte: range.startDate, $lte: range.endDate } }).lean()
        : [];
    expenseCategories.promotions = paidPromotions.reduce((sum, promotion) => sum + Number(promotion.cost || 0), 0);
    const earningsTotal = Object.values(earningCategories).reduce((sum, value) => sum + value, 0);
    const expensesTotal = Object.values(expenseCategories).reduce((sum, value) => sum + value, 0);
    return { currency, availableCurrencies: Object.values(transaction_enum_1.WalletEnum), earnings: { total: earningsTotal, categories: earningCategories }, expenses: { total: expensesTotal, categories: expenseCategories } };
};
const orderBucket = (order) => {
    if (order.deliveryStatus === order_enum_1.OrderDeliveryStatus.returned || order.returnedAt)
        return "returned";
    if (order.status === order_enum_1.OrderStatus.canceled || order.deliveryStatus === order_enum_1.OrderDeliveryStatus.canceled)
        return "cancelled";
    if (order.status === order_enum_1.OrderStatus.completed || [order_enum_1.OrderDeliveryStatus.delivered, order_enum_1.OrderDeliveryStatus.received].includes(order.deliveryStatus))
        return "completed";
    return "pending";
};
const summarizeOrders = (orders) => {
    const result = { total: orders.length, completed: 0, pending: 0, cancelled: 0, returned: 0 };
    orders.forEach(order => { result[orderBucket(order)] += 1; });
    return result;
};
const tradeSummary = async (userId, range) => {
    const [orders, sales] = await Promise.all([
        order_model_1.default.find({ userId, ...dateFilter(range) }).select("status deliveryStatus returnedAt").lean(),
        order_model_1.default.find({ "products.merchantId": userId, ...dateFilter(range) }).select("status deliveryStatus returnedAt products").lean(),
    ]);
    const orderSummary = summarizeOrders(orders);
    const salesSummary = summarizeOrders(sales);
    return { orders: orderSummary, sales: { ...salesSummary, ongoing: salesSummary.pending } };
};
const fetchTarget = async (userId, range, currency, duration) => {
    const normalizedDuration = duration === "annual" ? "yearly" : duration || (range.month ? "monthly" : "yearly");
    const targetQuery = { userId, duration: normalizedDuration, currency, year: range.year };
    if (normalizedDuration === "monthly")
        targetQuery.month = range.month || range.startDate.getUTCMonth() + 1;
    const target = await target_model_1.default.findOne(targetQuery).sort({ updatedAt: -1 }).lean()
        || await target_model_1.default.findOne({ userId, duration: normalizedDuration, currency, year: { $exists: false } }).sort({ updatedAt: -1 }).lean();
    if (!target)
        return { configured: false, duration: normalizedDuration, currency, goals: { jobs: 0, amount: 0, referrals: 0, invites: 0 }, actual: { jobs: 0, amount: 0, referrals: 0, invites: 0 }, progress: { jobs: 0, amount: 0, referrals: 0, invites: 0, overall: 0 } };
    const user = await users_model_1.default.findById(userId).select("invitedUsers").lean();
    const invitedEmails = user?.invitedUsers || [];
    const [projects, earnings, registeredReferrals, invitesInPeriod] = await Promise.all([
        project_model_1.default.find({ user: userId }).select("_id").lean(),
        transaction_model_1.default.aggregate([
            { $match: { recieverId: userId, currency, ...completedTransactionDateQuery(range) } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        users_model_1.default.countDocuments({ email: { $in: invitedEmails.map(email => String(email).toLowerCase()) }, ...dateFilter(range) }),
        report_event_model_1.default.countDocuments({ subjectUserId: userId, type: report_event_model_1.ReportEventType.invite, ...dateFilter(range) }),
    ]);
    const completedJobs = await jobs_model_1.default.countDocuments({ acceptedApplicationId: { $in: ids(projects) }, status: jobs_enum_1.JobStatusEnum.complete, updatedAt: { $gte: range.startDate, $lte: range.endDate } });
    const actual = { jobs: completedJobs, amount: earnings[0]?.total || 0, referrals: registeredReferrals, invites: invitesInPeriod };
    const goals = { jobs: target.job || 0, amount: target.amount || 0, referrals: target.referrals || 0, invites: target.invites || 0 };
    const progress = { jobs: percent(actual.jobs, goals.jobs), amount: percent(actual.amount, goals.amount), referrals: percent(actual.referrals, goals.referrals), invites: percent(actual.invites, goals.invites), overall: 0 };
    const enabled = [progress.jobs, progress.amount, progress.referrals, progress.invites].filter((_, index) => Object.values(goals)[index] > 0);
    progress.overall = enabled.length ? Math.floor(enabled.reduce((sum, value) => sum + value, 0) / enabled.length) : 0;
    return { configured: true, id: target._id, duration: normalizedDuration, currency, year: target.year, month: target.month || null, goals, actual, progress };
};
const insightSummary = async (userId, range, currency) => {
    const [events, ownedJobs, ownedProducts, ownedBusinesses, promotions, target] = await Promise.all([
        report_event_model_1.default.find({ subjectUserId: userId, createdAt: { $gte: range.startDate, $lte: range.endDate } }).lean(),
        jobs_model_1.default.find({ userId }).select("_id").lean(),
        product_model_1.default.find({ userId }).select("_id").lean(),
        business_model_1.default.find({ userId }).select("_id").lean(),
        promotion_model_1.default.find({ userId, startDate: { $lte: range.endDate }, endDate: { $gte: range.startDate } }).sort({ endDate: -1 }).lean(),
        fetchTarget(userId, range, currency),
    ]);
    const [jobSaves, productSaves, businessSaves] = await Promise.all([
        joblike_model_1.default.countDocuments({ job: { $in: ids(ownedJobs) }, ...dateFilter(range) }),
        productLike_model_1.default.countDocuments({ product: { $in: ids(ownedProducts) }, ...dateFilter(range) }),
        businessLike_model_1.default.countDocuments({ business: { $in: ids(ownedBusinesses) }, ...dateFilter(range) }),
    ]);
    const impressions = events.filter(event => event.type === report_event_model_1.ReportEventType.impression);
    const clicks = events.filter(event => event.type === report_event_model_1.ReportEventType.click);
    const shares = events.filter(event => event.type === report_event_model_1.ReportEventType.share).length;
    const contacts = events.filter(event => event.type === report_event_model_1.ReportEventType.contact).length;
    const reach = new Set(impressions.map(event => String(event.actorUserId || `anonymous:${event._id}`))).size;
    const activePromotion = promotions.find(promotion => promotion.isActive && promotion.endDate >= new Date()) || promotions[0];
    const totalDurationDays = activePromotion ? Math.max(0, Math.ceil((activePromotion.endDate.getTime() - activePromotion.startDate.getTime()) / DAY)) : 0;
    const daysRemaining = activePromotion ? Math.max(0, Math.ceil((activePromotion.endDate.getTime() - Date.now()) / DAY)) : 0;
    const promotionClicks = promotions.reduce((sum, promotion) => sum + Number(promotion.clicks || 0), 0);
    return {
        overview: { impressions: impressions.length, reach, saves: jobSaves + productSaves + businessSaves, shares, clicks: clicks.length, contacts },
        promotionDuration: { active: Boolean(activePromotion?.isActive), promotionId: activePromotion?._id || null, totalDays: totalDurationDays, daysRemaining, daysUsed: Math.max(0, totalDurationDays - daysRemaining) },
        clicks: { trackedClicks: clicks.length, promotionClicks, total: Math.max(clicks.length, promotionClicks), limit: null, remaining: null },
        targets: target,
        trackingNote: "Time-filtered click, impression, share and contact analytics include events recorded after report-event tracking was deployed. Saves use timestamped like records.",
    };
};
const fetchUserReport = async (userId, query = {}) => {
    if (!mongoose_1.Types.ObjectId.isValid(userId))
        throw new error_1.BadRequestError("Invalid user ID");
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const range = (0, exports.resolveReportRange)(query);
    const currency = String(query.currency || transaction_enum_1.WalletEnum.NGN).toUpperCase();
    if (!Object.values(transaction_enum_1.WalletEnum).includes(currency))
        throw new error_1.BadRequestError("Unsupported report currency");
    const [jobs, applications, finance, trade, insights] = await Promise.all([
        jobSummary(userObjectId, range),
        applicationSummary(userObjectId, range),
        financialSummary(userObjectId, range, currency),
        tradeSummary(userObjectId, range),
        insightSummary(userObjectId, range, currency),
    ]);
    return { filters: { startDate: range.startDate, endDate: range.endDate, year: range.year, month: range.month, range: query.range || (range.month ? "month" : "year"), label: range.label, currency }, jobs, applications, finance, trade, insights };
};
exports.fetchUserReport = fetchUserReport;
const upsertUserTarget = async (userId, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(userId))
        throw new error_1.BadRequestError("Invalid user ID");
    const duration = payload.duration === "annual" ? "yearly" : payload.duration;
    if (!["monthly", "yearly"].includes(duration))
        throw new error_1.BadRequestError("Target duration must be monthly or yearly");
    const now = new Date();
    const year = Number(payload.year || now.getUTCFullYear());
    const month = duration === "monthly" ? Number(payload.month || now.getUTCMonth() + 1) : null;
    if (!Number.isInteger(year) || year < 2000 || year > 2100)
        throw new error_1.BadRequestError("Invalid target year");
    if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12))
        throw new error_1.BadRequestError("Invalid target month");
    const currency = String(payload.currency || transaction_enum_1.WalletEnum.NGN).toUpperCase();
    if (!Object.values(transaction_enum_1.WalletEnum).includes(currency))
        throw new error_1.BadRequestError("Unsupported target currency");
    const values = ["job", "amount", "referrals", "invites"].reduce((result, key) => {
        const value = Number(payload[key] || 0);
        if (!Number.isFinite(value) || value < 0)
            throw new error_1.BadRequestError(`${key} target cannot be negative`);
        result[key] = value;
        return result;
    }, {});
    const filter = { userId: new mongoose_1.Types.ObjectId(userId), duration, year, currency };
    if (duration === "monthly")
        filter.month = month;
    else
        filter.month = null;
    const target = await target_model_1.default.findOneAndUpdate(filter, { $set: { ...values, duration, year, month, currency } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    return target;
};
exports.upsertUserTarget = upsertUserTarget;
const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const buildUserReportCsv = (report) => {
    const rows = [["Section", "Metric", "Value", "Currency", "Start Date", "End Date"]];
    const add = (section, metric, value, currency = "") => rows.push([section, metric, value, currency, report.filters.startDate.toISOString(), report.filters.endDate.toISOString()]);
    Object.entries(report.jobs).filter(([, value]) => typeof value === "number").forEach(([metric, value]) => add("Jobs", metric, value));
    Object.entries(report.applications.applicants).forEach(([metric, value]) => add("Applications - Applicants", metric, value));
    Object.entries(report.applications.myApplications).forEach(([metric, value]) => add("Applications - Mine", metric, value));
    Object.entries(report.finance.earnings.categories).forEach(([metric, value]) => add("Earnings", metric, value, report.filters.currency));
    add("Earnings", "total", report.finance.earnings.total, report.filters.currency);
    Object.entries(report.finance.expenses.categories).forEach(([metric, value]) => add("Expenses", metric, value, report.filters.currency));
    add("Expenses", "total", report.finance.expenses.total, report.filters.currency);
    Object.entries(report.trade.orders).forEach(([metric, value]) => add("Orders", metric, value));
    Object.entries(report.trade.sales).filter(([, value]) => typeof value === "number").forEach(([metric, value]) => add("Sales", metric, value));
    Object.entries(report.insights.overview).forEach(([metric, value]) => add("Insights", metric, value));
    Object.entries(report.insights.promotionDuration).forEach(([metric, value]) => add("Promotion Duration", metric, value));
    Object.entries(report.insights.clicks).forEach(([metric, value]) => add("Click Performance", metric, value));
    Object.entries(report.insights.targets.goals || {}).forEach(([metric, value]) => add("Targets - Goals", metric, value, report.filters.currency));
    Object.entries(report.insights.targets.actual || {}).forEach(([metric, value]) => add("Targets - Actual", metric, value, report.filters.currency));
    Object.entries(report.insights.targets.progress || {}).forEach(([metric, value]) => add("Targets - Progress", metric, value));
    return "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
};
exports.buildUserReportCsv = buildUserReportCsv;
