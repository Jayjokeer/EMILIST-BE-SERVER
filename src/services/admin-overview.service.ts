import { Types } from "mongoose";
import Users from "../models/users.model";
import Transaction from "../models/transaction.model";
import Jobs from "../models/jobs.model";
import Project from "../models/project.model";
import Order from "../models/order.model";
import Product from "../models/product.model";
import Category from "../models/categories.model";
import Business from "../models/business.model";
import { JobStatusEnum, MilestoneEnum } from "../enums/jobs.enum";
import { OrderDeliveryStatus, OrderPaymentStatus } from "../enums/order.enum";
import { TransactionEnum } from "../enums/transaction.enum";
import { UserStatus } from "../enums/user.enums";
import { countUnresolvedSupportRequests } from "./support-request.service";

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

export const overviewRange = (value?: string, now = new Date()) => {
  const range = RANGE_DAYS[String(value || "30d").toLowerCase()] ? String(value || "30d").toLowerCase() : "30d";
  const days = RANGE_DAYS[range];
  const currentEnd = now;
  const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousEnd = currentStart;
  const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);
  return { range, days, currentStart, currentEnd, previousStart, previousEnd };
};

export const percentageChange = (current: number, previous: number) =>
  previous === 0 ? (current > 0 ? 100 : 0) : Number((((current - previous) / previous) * 100).toFixed(2));

const countComparison = async (model: any, baseQuery: any, range: ReturnType<typeof overviewRange>) => {
  const [current, previous] = await Promise.all([
    model.countDocuments({ ...baseQuery, createdAt: { $gte: range.currentStart, $lte: range.currentEnd } }),
    model.countDocuments({ ...baseQuery, createdAt: { $gte: range.previousStart, $lt: range.previousEnd } }),
  ]);
  return { count: current, previousCount: previous, percentageChange: percentageChange(current, previous) };
};

const sumRows = (rows: any[], key: string) => rows.find((row) => row._id === key)?.count || 0;

export const fetchAdminOverview = async (rangeValue?: string) => {
  const range = overviewRange(rangeValue);
  const unresolvedSupportRequests = await countUnresolvedSupportRequests();

  const [
    signUps,
    pendingTransactions,
    ordersInTransit,
    pausedMilestonesRows,
    transactionRows,
    transactionValueRows,
    jobRows,
    totalApplications,
    activeCustomers,
    pendingKyc,
    inactiveCustomers,
    expertIds,
    merchantIds,
    customerGrowth,
    revenueRows,
    previousRevenueRows,
    revenueTrend,
    categoryCount,
    verifiedMerchantIds,
    newOrders,
    orderRows,
    grossSalesRows,
  ] = await Promise.all([
    countComparison(Users, {}, range),
    countComparison(Transaction, { status: { $in: [TransactionEnum.pending, TransactionEnum.processing] } }, range),
    countComparison(Order, { deliveryStatus: OrderDeliveryStatus.outForDelivery }, range),
    Jobs.aggregate([
      { $unwind: "$milestones" },
      { $match: { "milestones.status": MilestoneEnum.paused } },
      { $count: "count" },
    ]),
    Transaction.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Transaction.aggregate([
      { $match: { status: TransactionEnum.completed } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Jobs.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Project.countDocuments(),
    Users.countDocuments({ status: UserStatus.active }),
    Users.countDocuments({ isVerified: false, requestedVerification: true }),
    Users.countDocuments({ status: UserStatus.deactivated }),
    Business.distinct("userId"),
    Product.distinct("userId", { isDeleted: false }),
    countComparison(Users, {}, range),
    Transaction.aggregate([
      { $match: { status: TransactionEnum.completed, createdAt: { $gte: range.currentStart, $lte: range.currentEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { status: TransactionEnum.completed, createdAt: { $gte: range.previousStart, $lt: range.previousEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { status: TransactionEnum.completed, createdAt: { $gte: range.currentStart, $lte: range.currentEnd } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, amount: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]),
    Category.countDocuments({ isActive: true }),
    Product.distinct("userId", { isDeleted: false }),
    countComparison(Order, {}, range),
    Order.aggregate([{ $group: { _id: "$deliveryStatus", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { paymentStatus: OrderPaymentStatus.paid } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  const pausedMilestones = pausedMilestonesRows[0]?.count || 0;
  const currentRevenue = revenueRows[0]?.total || 0;
  const previousRevenue = previousRevenueRows[0]?.total || 0;
  const merchantObjectIds = verifiedMerchantIds.filter(Boolean).map((id: any) => new Types.ObjectId(String(id)));
  const verifiedMerchants = merchantObjectIds.length
    ? await Users.countDocuments({ _id: { $in: merchantObjectIds }, isVerified: true })
    : 0;

  const jobTotal = jobRows.reduce((total: number, row: any) => total + row.count, 0);
  const transactionTotal = transactionRows.reduce((total: number, row: any) => total + row.count, 0);

  return {
    range: range.range,
    period: { from: range.currentStart, to: range.currentEnd },
    headline: {
      newSignUps: signUps,
      pendingTransactions,
      pausedMilestones: { count: pausedMilestones },
      ordersInTransit,
    },
    transactionSummary: {
      total: transactionTotal,
      totalValue: transactionValueRows[0]?.total || 0,
      successful: sumRows(transactionRows, TransactionEnum.completed),
      pending: sumRows(transactionRows, TransactionEnum.pending) + sumRows(transactionRows, TransactionEnum.processing),
      failed: sumRows(transactionRows, TransactionEnum.failed),
      cancelled: sumRows(transactionRows, TransactionEnum.declined),
    },
    jobSummary: {
      total: jobTotal,
      listed: sumRows(jobRows, JobStatusEnum.listed),
      completed: sumRows(jobRows, JobStatusEnum.complete),
      pending: sumRows(jobRows, JobStatusEnum.pending) + sumRows(jobRows, JobStatusEnum.in_review),
      overdue: sumRows(jobRows, JobStatusEnum.overdue),
      paused: sumRows(jobRows, JobStatusEnum.paused),
      applicationsReceived: totalApplications,
    },
    customerSummary: {
      total: await Users.countDocuments(),
      active: activeCustomers,
      pendingKyc,
      inactive: inactiveCustomers,
      experts: expertIds.filter(Boolean).length,
      merchants: merchantIds.filter(Boolean).length,
      growthPercentage: customerGrowth.percentageChange,
    },
    revenueSummary: {
      current: currentRevenue,
      previous: previousRevenue,
      percentageChange: percentageChange(currentRevenue, previousRevenue),
      allTime: transactionValueRows[0]?.total || 0,
      trend: revenueTrend.map((row: any) => ({ date: row._id, amount: row.amount })),
    },
    quickActions: {
      overdueJobs: sumRows(jobRows, JobStatusEnum.overdue),
      pausedJobs: sumRows(jobRows, JobStatusEnum.paused),
      failedTransactions: sumRows(transactionRows, TransactionEnum.failed),
      customerSupport: { count: unresolvedSupportRequests, available: true },
    },
    tradeSummary: {
      verifiedMerchants,
      productCategories: categoryCount,
      newOrders,
      deliveriesInProgress: sumRows(orderRows, OrderDeliveryStatus.outForDelivery),
      cancelledOrders: sumRows(orderRows, OrderDeliveryStatus.canceled),
      returnedOrders: sumRows(orderRows, OrderDeliveryStatus.returned),
      completedOrders: sumRows(orderRows, OrderDeliveryStatus.delivered),
      grossSalesVolume: grossSalesRows[0]?.total || 0,
    },
  };
};
