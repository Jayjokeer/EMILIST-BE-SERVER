"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAdminOverview = exports.percentageChange = exports.overviewRange = void 0;
const mongoose_1 = require("mongoose");
const users_model_1 = __importDefault(require("../models/users.model"));
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const project_model_1 = __importDefault(require("../models/project.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const categories_model_1 = __importDefault(require("../models/categories.model"));
const business_model_1 = __importDefault(require("../models/business.model"));
const jobs_enum_1 = require("../enums/jobs.enum");
const order_enum_1 = require("../enums/order.enum");
const transaction_enum_1 = require("../enums/transaction.enum");
const user_enums_1 = require("../enums/user.enums");
const RANGE_DAYS = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "12m": 365,
};
const overviewRange = (value, now = new Date()) => {
    const range = RANGE_DAYS[String(value || "30d").toLowerCase()] ? String(value || "30d").toLowerCase() : "30d";
    const days = RANGE_DAYS[range];
    const currentEnd = now;
    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousEnd = currentStart;
    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);
    return { range, days, currentStart, currentEnd, previousStart, previousEnd };
};
exports.overviewRange = overviewRange;
const percentageChange = (current, previous) => previous === 0 ? (current > 0 ? 100 : 0) : Number((((current - previous) / previous) * 100).toFixed(2));
exports.percentageChange = percentageChange;
const countComparison = async (model, baseQuery, range) => {
    const [current, previous] = await Promise.all([
        model.countDocuments({ ...baseQuery, createdAt: { $gte: range.currentStart, $lte: range.currentEnd } }),
        model.countDocuments({ ...baseQuery, createdAt: { $gte: range.previousStart, $lt: range.previousEnd } }),
    ]);
    return { count: current, previousCount: previous, percentageChange: (0, exports.percentageChange)(current, previous) };
};
const sumRows = (rows, key) => rows.find((row) => row._id === key)?.count || 0;
const fetchAdminOverview = async (rangeValue) => {
    const range = (0, exports.overviewRange)(rangeValue);
    const [signUps, pendingTransactions, ordersInTransit, pausedMilestonesRows, transactionRows, transactionValueRows, jobRows, totalApplications, activeCustomers, pendingKyc, inactiveCustomers, expertIds, merchantIds, customerGrowth, revenueRows, previousRevenueRows, revenueTrend, categoryCount, verifiedMerchantIds, newOrders, orderRows, grossSalesRows,] = await Promise.all([
        countComparison(users_model_1.default, {}, range),
        countComparison(transaction_model_1.default, { status: { $in: [transaction_enum_1.TransactionEnum.pending, transaction_enum_1.TransactionEnum.processing] } }, range),
        countComparison(order_model_1.default, { deliveryStatus: order_enum_1.OrderDeliveryStatus.outForDelivery }, range),
        jobs_model_1.default.aggregate([
            { $unwind: "$milestones" },
            { $match: { "milestones.status": jobs_enum_1.MilestoneEnum.paused } },
            { $count: "count" },
        ]),
        transaction_model_1.default.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        transaction_model_1.default.aggregate([
            { $match: { status: transaction_enum_1.TransactionEnum.completed } },
            { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        jobs_model_1.default.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        project_model_1.default.countDocuments(),
        users_model_1.default.countDocuments({ status: user_enums_1.UserStatus.active }),
        users_model_1.default.countDocuments({ isVerified: false, requestedVerification: true }),
        users_model_1.default.countDocuments({ status: user_enums_1.UserStatus.deactivated }),
        business_model_1.default.distinct("userId"),
        product_model_1.default.distinct("userId", { isDeleted: false }),
        countComparison(users_model_1.default, {}, range),
        transaction_model_1.default.aggregate([
            { $match: { status: transaction_enum_1.TransactionEnum.completed, createdAt: { $gte: range.currentStart, $lte: range.currentEnd } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        transaction_model_1.default.aggregate([
            { $match: { status: transaction_enum_1.TransactionEnum.completed, createdAt: { $gte: range.previousStart, $lt: range.previousEnd } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        transaction_model_1.default.aggregate([
            { $match: { status: transaction_enum_1.TransactionEnum.completed, createdAt: { $gte: range.currentStart, $lte: range.currentEnd } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, amount: { $sum: "$amount" } } },
            { $sort: { _id: 1 } },
        ]),
        categories_model_1.default.countDocuments({ isActive: true }),
        product_model_1.default.distinct("userId", { isDeleted: false }),
        countComparison(order_model_1.default, {}, range),
        order_model_1.default.aggregate([{ $group: { _id: "$deliveryStatus", count: { $sum: 1 } } }]),
        order_model_1.default.aggregate([
            { $match: { paymentStatus: order_enum_1.OrderPaymentStatus.paid } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
    ]);
    const pausedMilestones = pausedMilestonesRows[0]?.count || 0;
    const currentRevenue = revenueRows[0]?.total || 0;
    const previousRevenue = previousRevenueRows[0]?.total || 0;
    const merchantObjectIds = verifiedMerchantIds.filter(Boolean).map((id) => new mongoose_1.Types.ObjectId(String(id)));
    const verifiedMerchants = merchantObjectIds.length
        ? await users_model_1.default.countDocuments({ _id: { $in: merchantObjectIds }, isVerified: true })
        : 0;
    const jobTotal = jobRows.reduce((total, row) => total + row.count, 0);
    const transactionTotal = transactionRows.reduce((total, row) => total + row.count, 0);
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
            successful: sumRows(transactionRows, transaction_enum_1.TransactionEnum.completed),
            pending: sumRows(transactionRows, transaction_enum_1.TransactionEnum.pending) + sumRows(transactionRows, transaction_enum_1.TransactionEnum.processing),
            failed: sumRows(transactionRows, transaction_enum_1.TransactionEnum.failed),
            cancelled: sumRows(transactionRows, transaction_enum_1.TransactionEnum.declined),
        },
        jobSummary: {
            total: jobTotal,
            listed: sumRows(jobRows, jobs_enum_1.JobStatusEnum.listed),
            completed: sumRows(jobRows, jobs_enum_1.JobStatusEnum.complete),
            pending: sumRows(jobRows, jobs_enum_1.JobStatusEnum.pending) + sumRows(jobRows, jobs_enum_1.JobStatusEnum.in_review),
            overdue: sumRows(jobRows, jobs_enum_1.JobStatusEnum.overdue),
            paused: sumRows(jobRows, jobs_enum_1.JobStatusEnum.paused),
            applicationsReceived: totalApplications,
        },
        customerSummary: {
            total: await users_model_1.default.countDocuments(),
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
            percentageChange: (0, exports.percentageChange)(currentRevenue, previousRevenue),
            allTime: transactionValueRows[0]?.total || 0,
            trend: revenueTrend.map((row) => ({ date: row._id, amount: row.amount })),
        },
        quickActions: {
            overdueJobs: sumRows(jobRows, jobs_enum_1.JobStatusEnum.overdue),
            pausedJobs: sumRows(jobRows, jobs_enum_1.JobStatusEnum.paused),
            failedTransactions: sumRows(transactionRows, transaction_enum_1.TransactionEnum.failed),
            customerSupport: { count: 0, available: false, reason: "Support requests are not yet stored in this backend" },
        },
        tradeSummary: {
            verifiedMerchants,
            productCategories: categoryCount,
            newOrders,
            deliveriesInProgress: sumRows(orderRows, order_enum_1.OrderDeliveryStatus.outForDelivery),
            cancelledOrders: sumRows(orderRows, order_enum_1.OrderDeliveryStatus.canceled),
            returnedOrders: sumRows(orderRows, order_enum_1.OrderDeliveryStatus.returned),
            completedOrders: sumRows(orderRows, order_enum_1.OrderDeliveryStatus.delivered),
            grossSalesVolume: grossSalesRows[0]?.total || 0,
        },
    };
};
exports.fetchAdminOverview = fetchAdminOverview;
