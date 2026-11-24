import { Types } from "mongoose";
import { BadRequestError } from "../errors/error";
import { JobStatusEnum } from "../enums/jobs.enum";
import { OrderDeliveryStatus, OrderStatus } from "../enums/order.enum";
import { ProjectStatusEnum } from "../enums/project.enum";
import { PromotionPaymentStatus } from "../enums/suscribtion.enum";
import { ServiceEnum, TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import Business from "../models/business.model";
import BusinessLike from "../models/businessLike.model";
import JobLike from "../models/joblike.model";
import Jobs from "../models/jobs.model";
import Order from "../models/order.model";
import Product from "../models/product.model";
import ProductLike from "../models/productLike.model";
import Project from "../models/project.model";
import Promotion from "../models/promotion.model";
import ReportEvent, { ReportEventType } from "../models/report-event.model";
import Target from "../models/target.model";
import Transaction from "../models/transaction.model";
import Users from "../models/users.model";

const DAY = 24 * 60 * 60 * 1000;

export interface ReportQuery {
  year?: string | number;
  month?: string | number;
  range?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
}

export interface ReportRange {
  startDate: Date;
  endDate: Date;
  year: number;
  month: number | null;
  label: string;
}

const endOfUtcDay = (date: Date) => {
  const result = new Date(date);
  result.setUTCHours(23, 59, 59, 999);
  return result;
};

const parseIsoDate = (value: string, label: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestError(`${label} must use YYYY-MM-DD`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestError(`${label} is not a valid calendar date`);
  }
  return date;
};

export const resolveReportRange = (query: ReportQuery = {}, now = new Date()): ReportRange => {
  let startDate: Date;
  let endDate: Date;
  let month: number | null = null;

  if (query.startDate || query.endDate) {
    if (!query.startDate || !query.endDate) throw new BadRequestError("Both startDate and endDate are required");
    startDate = parseIsoDate(query.startDate, "startDate");
    endDate = endOfUtcDay(parseIsoDate(query.endDate, "endDate"));
  } else if (["last7days", "last30days", "last90days"].includes(String(query.range))) {
    const days = Number(String(query.range).match(/\d+/)?.[0] || 30);
    endDate = endOfUtcDay(now);
    startDate = new Date(endDate.getTime() - (days - 1) * DAY);
    startDate.setUTCHours(0, 0, 0, 0);
  } else {
    const year = Number(query.year || now.getUTCFullYear());
    if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new BadRequestError("Invalid report year");

    if (query.month !== undefined && query.month !== "") {
      month = Number(query.month);
      if (!Number.isInteger(month) || month < 1 || month > 12) throw new BadRequestError("Month must be between 1 and 12");
      startDate = new Date(Date.UTC(year, month - 1, 1));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    } else if (String(query.range) === "year") {
      startDate = new Date(Date.UTC(year, 0, 1));
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    } else {
      month = now.getUTCMonth() + 1;
      startDate = new Date(Date.UTC(year, month - 1, 1));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    }
  }

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
    throw new BadRequestError("Invalid report date range");
  }
  if (endDate.getTime() - startDate.getTime() > 366 * DAY) {
    throw new BadRequestError("Report date range cannot exceed 366 days");
  }

  const year = startDate.getUTCFullYear();
  const formatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return { startDate, endDate, year, month, label: `${formatter.format(startDate)} - ${formatter.format(endDate)}` };
};

const dateFilter = (range: ReportRange, field = "createdAt") => ({ [field]: { $gte: range.startDate, $lte: range.endDate } });
const percent = (value: number, total: number) => total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
const ids = (values: any[]) => values.map(value => value._id);

const jobSummary = async (userId: Types.ObjectId, range: ReportRange) => {
  const jobs = await Jobs.find({ userId, ...dateFilter(range) }).select("status endDate").lean();
  const now = new Date();
  const overdue = jobs.filter(job => job.status === JobStatusEnum.overdue || (job.status === JobStatusEnum.active && job.endDate && new Date(job.endDate) < now)).length;
  const active = jobs.filter(job => job.status === JobStatusEnum.active && !(job.endDate && new Date(job.endDate) < now)).length;
  const pendingStatuses = new Set([JobStatusEnum.draft, JobStatusEnum.listed, JobStatusEnum.pending, JobStatusEnum.in_review]);
  const pending = jobs.filter(job => pendingStatuses.has(job.status as JobStatusEnum)).length;
  const completed = jobs.filter(job => job.status === JobStatusEnum.complete).length;
  const total = jobs.length;
  return { total, active, pending, completed, overdue, distribution: { active: percent(active, total), pending: percent(pending, total), completed: percent(completed, total), overdue: percent(overdue, total) }, hasRecords: total > 0 };
};

const rehireCount = (projects: any[], range: ReportRange, counterpart: "user" | "creator") => {
  const seen = new Set<string>();
  let rehires = 0;
  projects
    .sort((a, b) => new Date(a.acceptedAt || a.createdAt).getTime() - new Date(b.acceptedAt || b.createdAt).getTime())
    .forEach(project => {
      const key = String(project[counterpart]);
      const acceptedAt = new Date(project.acceptedAt || project.createdAt);
      if (seen.has(key) && acceptedAt >= range.startDate && acceptedAt <= range.endDate) rehires += 1;
      seen.add(key);
    });
  return rehires;
};

const applicationSummary = async (userId: Types.ObjectId, range: ReportRange) => {
  const hiredStatuses = [ProjectStatusEnum.accepted, ProjectStatusEnum.completed];
  const [received, mine, receivedHireHistory, myHireHistory] = await Promise.all([
    Project.find({ creator: userId, ...dateFilter(range, "appliedAt") }).lean(),
    Project.find({ user: userId, ...dateFilter(range, "appliedAt") }).lean(),
    Project.find({ creator: userId, status: { $in: hiredStatuses }, createdAt: { $lte: range.endDate } }).select("user status acceptedAt createdAt").lean(),
    Project.find({ user: userId, status: { $in: hiredStatuses }, createdAt: { $lte: range.endDate } }).select("creator status acceptedAt createdAt").lean(),
  ]);
  const summarize = (projects: any[], rehires: number) => {
    const hired = projects.filter(project => hiredStatuses.includes(project.status)).length;
    return { total: projects.length, hired, rehired: rehires, flagged: 0, pending: projects.filter(project => [ProjectStatusEnum.applied, ProjectStatusEnum.pending, ProjectStatusEnum.in_review].includes(project.status)).length, rejected: projects.filter(project => project.status === ProjectStatusEnum.rejected).length };
  };
  return {
    applicants: summarize(received, rehireCount(receivedHireHistory, range, "user")),
    myApplications: summarize(mine, rehireCount(myHireHistory, range, "creator")),
    flaggedTrackingAvailable: false,
  };
};

const completedTransactionDateQuery = (range: ReportRange) => ({
  status: TransactionEnum.completed,
  $or: [
    { dateCompleted: { $gte: range.startDate, $lte: range.endDate } },
    { dateCompleted: { $exists: false }, ...dateFilter(range) },
    { dateCompleted: null, ...dateFilter(range) },
  ],
});

const financialSummary = async (userId: Types.ObjectId, range: ReportRange, currency: WalletEnum) => {
  const transactions = await Transaction.find({
    currency,
    ...completedTransactionDateQuery(range),
    $and: [{ $or: [{ userId }, { recieverId: userId }] }],
  }).lean();

  const earningCategories = { jobs: 0, materials: 0, referrals: 0, others: 0 };
  const expenseCategories = { jobs: 0, materials: 0, promotions: 0, others: 0 };
  for (const transaction of transactions) {
    if (String(transaction.recieverId) === String(userId)) {
      if (transaction.serviceType === ServiceEnum.job) earningCategories.jobs += transaction.amount;
      else if (transaction.serviceType === ServiceEnum.material) earningCategories.materials += transaction.amount;
      else earningCategories.others += transaction.amount;
    }
    if (String(transaction.userId) === String(userId) && transaction.type === TransactionType.DEBIT) {
      if (transaction.serviceType === ServiceEnum.job) expenseCategories.jobs += transaction.amount;
      else if (transaction.serviceType === ServiceEnum.material) expenseCategories.materials += transaction.amount;
      else expenseCategories.others += transaction.amount;
    }
  }

  const paidPromotions = currency === WalletEnum.NGN
    ? await Promotion.find({ userId, paymentStatus: PromotionPaymentStatus.paid, createdAt: { $gte: range.startDate, $lte: range.endDate } }).lean()
    : [];
  expenseCategories.promotions = paidPromotions.reduce((sum, promotion) => sum + Number(promotion.cost || 0), 0);
  const earningsTotal = Object.values(earningCategories).reduce((sum, value) => sum + value, 0);
  const expensesTotal = Object.values(expenseCategories).reduce((sum, value) => sum + value, 0);
  return { currency, availableCurrencies: Object.values(WalletEnum), earnings: { total: earningsTotal, categories: earningCategories }, expenses: { total: expensesTotal, categories: expenseCategories } };
};

const orderBucket = (order: any) => {
  if (order.deliveryStatus === OrderDeliveryStatus.returned || order.returnedAt) return "returned";
  if (order.status === OrderStatus.canceled || order.deliveryStatus === OrderDeliveryStatus.canceled) return "cancelled";
  if (order.status === OrderStatus.completed || [OrderDeliveryStatus.delivered, OrderDeliveryStatus.received].includes(order.deliveryStatus)) return "completed";
  return "pending";
};

const summarizeOrders = (orders: any[]) => {
  const result = { total: orders.length, completed: 0, pending: 0, cancelled: 0, returned: 0 };
  orders.forEach(order => { result[orderBucket(order)] += 1; });
  return result;
};

const tradeSummary = async (userId: Types.ObjectId, range: ReportRange) => {
  const [orders, sales] = await Promise.all([
    Order.find({ userId, ...dateFilter(range) }).select("status deliveryStatus returnedAt").lean(),
    Order.find({ "products.merchantId": userId, ...dateFilter(range) }).select("status deliveryStatus returnedAt products").lean(),
  ]);
  const orderSummary = summarizeOrders(orders);
  const salesSummary = summarizeOrders(sales);
  return { orders: orderSummary, sales: { ...salesSummary, ongoing: salesSummary.pending } };
};

const fetchTarget = async (userId: Types.ObjectId, range: ReportRange, currency: WalletEnum, duration?: string) => {
  const normalizedDuration = duration === "annual" ? "yearly" : duration || (range.month ? "monthly" : "yearly");
  const targetQuery: any = { userId, duration: normalizedDuration, currency, year: range.year };
  if (normalizedDuration === "monthly") targetQuery.month = range.month || range.startDate.getUTCMonth() + 1;
  const target = await Target.findOne(targetQuery).sort({ updatedAt: -1 }).lean()
    || await Target.findOne({ userId, duration: normalizedDuration, currency, year: { $exists: false } }).sort({ updatedAt: -1 }).lean();
  if (!target) return { configured: false, duration: normalizedDuration, currency, goals: { jobs: 0, amount: 0, referrals: 0, invites: 0 }, actual: { jobs: 0, amount: 0, referrals: 0, invites: 0 }, progress: { jobs: 0, amount: 0, referrals: 0, invites: 0, overall: 0 } };

  const user = await Users.findById(userId).select("invitedUsers").lean();
  const invitedEmails = user?.invitedUsers || [];
  const [projects, earnings, registeredReferrals, invitesInPeriod] = await Promise.all([
    Project.find({ user: userId }).select("_id").lean(),
    Transaction.aggregate([
      { $match: { recieverId: userId, currency, ...completedTransactionDateQuery(range) } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Users.countDocuments({ email: { $in: invitedEmails.map(email => String(email).toLowerCase()) }, ...dateFilter(range) }),
    ReportEvent.countDocuments({ subjectUserId: userId, type: ReportEventType.invite, ...dateFilter(range) }),
  ]);
  const completedJobs = await Jobs.countDocuments({ acceptedApplicationId: { $in: ids(projects) }, status: JobStatusEnum.complete, updatedAt: { $gte: range.startDate, $lte: range.endDate } });
  const actual = { jobs: completedJobs, amount: earnings[0]?.total || 0, referrals: registeredReferrals, invites: invitesInPeriod };
  const goals = { jobs: target.job || 0, amount: target.amount || 0, referrals: target.referrals || 0, invites: target.invites || 0 };
  const progress = { jobs: percent(actual.jobs, goals.jobs), amount: percent(actual.amount, goals.amount), referrals: percent(actual.referrals, goals.referrals), invites: percent(actual.invites, goals.invites), overall: 0 };
  const enabled = [progress.jobs, progress.amount, progress.referrals, progress.invites].filter((_, index) => Object.values(goals)[index] > 0);
  progress.overall = enabled.length ? Math.floor(enabled.reduce((sum, value) => sum + value, 0) / enabled.length) : 0;
  return { configured: true, id: target._id, duration: normalizedDuration, currency, year: target.year, month: target.month || null, goals, actual, progress };
};

const insightSummary = async (userId: Types.ObjectId, range: ReportRange, currency: WalletEnum) => {
  const [events, ownedJobs, ownedProducts, ownedBusinesses, promotions, target] = await Promise.all([
    ReportEvent.find({ subjectUserId: userId, createdAt: { $gte: range.startDate, $lte: range.endDate } }).lean(),
    Jobs.find({ userId }).select("_id").lean(),
    Product.find({ userId }).select("_id").lean(),
    Business.find({ userId }).select("_id").lean(),
    Promotion.find({ userId, startDate: { $lte: range.endDate }, endDate: { $gte: range.startDate } }).sort({ endDate: -1 }).lean(),
    fetchTarget(userId, range, currency),
  ]);

  const [jobSaves, productSaves, businessSaves] = await Promise.all([
    JobLike.countDocuments({ job: { $in: ids(ownedJobs) }, ...dateFilter(range) }),
    ProductLike.countDocuments({ product: { $in: ids(ownedProducts) }, ...dateFilter(range) }),
    BusinessLike.countDocuments({ business: { $in: ids(ownedBusinesses) }, ...dateFilter(range) }),
  ]);
  const impressions = events.filter(event => event.type === ReportEventType.impression);
  const clicks = events.filter(event => event.type === ReportEventType.click);
  const shares = events.filter(event => event.type === ReportEventType.share).length;
  const contacts = events.filter(event => event.type === ReportEventType.contact).length;
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

export const fetchUserReport = async (userId: string, query: ReportQuery = {}) => {
  if (!Types.ObjectId.isValid(userId)) throw new BadRequestError("Invalid user ID");
  const userObjectId = new Types.ObjectId(userId);
  const range = resolveReportRange(query);
  const currency = String(query.currency || WalletEnum.NGN).toUpperCase() as WalletEnum;
  if (!Object.values(WalletEnum).includes(currency)) throw new BadRequestError("Unsupported report currency");

  const [jobs, applications, finance, trade, insights] = await Promise.all([
    jobSummary(userObjectId, range),
    applicationSummary(userObjectId, range),
    financialSummary(userObjectId, range, currency),
    tradeSummary(userObjectId, range),
    insightSummary(userObjectId, range, currency),
  ]);
  return { filters: { startDate: range.startDate, endDate: range.endDate, year: range.year, month: range.month, range: query.range || (range.month ? "month" : "year"), label: range.label, currency }, jobs, applications, finance, trade, insights };
};

export const upsertUserTarget = async (userId: string, payload: any) => {
  if (!Types.ObjectId.isValid(userId)) throw new BadRequestError("Invalid user ID");
  const duration = payload.duration === "annual" ? "yearly" : payload.duration;
  if (!["monthly", "yearly"].includes(duration)) throw new BadRequestError("Target duration must be monthly or yearly");
  const now = new Date();
  const year = Number(payload.year || now.getUTCFullYear());
  const month = duration === "monthly" ? Number(payload.month || now.getUTCMonth() + 1) : null;
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new BadRequestError("Invalid target year");
  if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) throw new BadRequestError("Invalid target month");
  const currency = String(payload.currency || WalletEnum.NGN).toUpperCase();
  if (!Object.values(WalletEnum).includes(currency as WalletEnum)) throw new BadRequestError("Unsupported target currency");
  const values = ["job", "amount", "referrals", "invites"].reduce<Record<string, number>>((result, key) => {
    const value = Number(payload[key] || 0);
    if (!Number.isFinite(value) || value < 0) throw new BadRequestError(`${key} target cannot be negative`);
    result[key] = value;
    return result;
  }, {});
  const filter: any = { userId: new Types.ObjectId(userId), duration, year, currency };
  if (duration === "monthly") filter.month = month;
  else filter.month = null;
  const target = await Target.findOneAndUpdate(filter, { $set: { ...values, duration, year, month, currency } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  return target;
};

const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
export const buildUserReportCsv = (report: any) => {
  const rows: unknown[][] = [["Section", "Metric", "Value", "Currency", "Start Date", "End Date"]];
  const add = (section: string, metric: string, value: unknown, currency = "") => rows.push([section, metric, value, currency, report.filters.startDate.toISOString(), report.filters.endDate.toISOString()]);
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
