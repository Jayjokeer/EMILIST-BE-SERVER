"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReport = exports.fetchReportsAnalytics = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const users_model_1 = __importDefault(require("../models/users.model"));
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const subscription_model_1 = __importDefault(require("../models/subscription.model"));
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const error_1 = require("../errors/error");
const DAY = 24 * 60 * 60 * 1000;
const dateKey = (value) => new Date(value).toISOString().slice(0, 10);
const boundaryDate = (value, endOfDay) => {
    const parsed = value instanceof Date ? new Date(value) : new Date(value);
    parsed.setUTCHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return parsed;
};
const parseRange = (startDate, endDate) => {
    const end = endDate ? boundaryDate(endDate, true) : new Date();
    const start = startDate ? boundaryDate(startDate, false) : boundaryDate(new Date(end.getTime() - (29 * DAY)), false);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end)
        throw new error_1.BadRequestError("Invalid report date range");
    if (end.getTime() - start.getTime() > 366 * DAY)
        throw new error_1.BadRequestError("Report range cannot exceed 366 days");
    return { start, end };
};
const fillDaily = (start, end, rows, valueField = "value") => {
    const values = new Map(rows.map((row) => [String(row._id), Number(row[valueField] || 0)]));
    const result = [];
    for (let cursor = new Date(start); cursor <= end; cursor = new Date(cursor.getTime() + DAY)) {
        const date = dateKey(cursor);
        result.push({ date, value: values.get(date) || 0 });
    }
    return result;
};
const dailyCount = (model, field, match, start, end) => model.aggregate([
    { $match: { ...match, [field]: { $gte: start, $lte: end } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: `$${field}`, timezone: "UTC" } }, value: { $sum: 1 } } },
    { $sort: { _id: 1 } },
]);
const dailyUsers = (model, userField, start, end) => model.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, [userField]: { $ne: null } } },
    { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, userId: `$${userField}` } } },
    { $group: { _id: "$_id.date", users: { $addToSet: "$_id.userId" } } },
]);
const fetchReportsAnalytics = async (startDate, endDate) => {
    const { start, end } = parseRange(startDate, endDate);
    const [acquisitionRows, churnRows, jobActivity, orderActivity, transactionActivity, subscriptionActivity, jobRows, materialRows, subscriptionRows] = await Promise.all([
        dailyCount(users_model_1.default, "createdAt", {}, start, end),
        dailyCount(users_model_1.default, "updatedAt", { status: { $ne: "Active" } }, start, end),
        dailyUsers(jobs_model_1.default, "userId", start, end),
        dailyUsers(order_model_1.default, "userId", start, end),
        dailyUsers(transaction_model_1.default, "userId", start, end),
        dailyUsers(subscription_model_1.default, "userId", start, end),
        jobs_model_1.default.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: "$status", value: { $sum: 1 } } },
        ]),
        order_model_1.default.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, paymentStatus: "paid" } },
            { $unwind: "$products" },
            { $group: { _id: { $ifNull: ["$products.categoryName", "Uncategorised"] }, itemsSold: { $sum: "$products.quantity" }, salesValue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } } } },
            { $sort: { itemsSold: -1 } },
        ]),
        subscription_model_1.default.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $lookup: { from: "plans", localField: "planId", foreignField: "_id", as: "plan" } },
            { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
            { $group: { _id: { month: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } }, plan: { $ifNull: ["$plan.name", "Unknown"] } }, value: { $sum: 1 } } },
            { $sort: { "_id.month": 1, "_id.plan": 1 } },
        ]),
    ]);
    const jobCounts = {};
    for (const row of jobRows)
        jobCounts[String(row._id || "unknown")] = Number(row.value || 0);
    const totalJobs = Object.values(jobCounts).reduce((sum, value) => sum + value, 0);
    const completedJobs = jobCounts.completed || 0;
    const activeByDate = new Map();
    for (const row of [...jobActivity, ...orderActivity, ...transactionActivity, ...subscriptionActivity]) {
        const users = activeByDate.get(String(row._id)) || new Set();
        for (const userId of row.users || [])
            users.add(String(userId));
        activeByDate.set(String(row._id), users);
    }
    const activeRows = [...activeByDate].map(([date, users]) => ({ _id: date, value: users.size }));
    return {
        range: { startDate: dateKey(start), endDate: dateKey(end) },
        definitions: {
            platformChurn: "Accounts currently inactive, grouped by their last account update date.",
            dailyActiveUsers: "Unique users who created a job, order, transaction, or subscription that day.",
            jobSuccess: "Completed jobs as a percentage of jobs created in the selected range.",
        },
        platformChurn: fillDaily(start, end, churnRows),
        userAcquisition: fillDaily(start, end, acquisitionRows),
        dailyActiveUsers: fillDaily(start, end, activeRows),
        jobSuccess: {
            averageSuccessRate: totalJobs ? Number(((completedJobs / totalJobs) * 100).toFixed(1)) : 0,
            total: totalJobs,
            breakdown: jobCounts,
        },
        materialSales: materialRows.map((row) => ({ category: row._id, itemsSold: row.itemsSold, salesValue: row.salesValue })),
        subscriptionPerformance: subscriptionRows.map((row) => ({ month: row._id.month, plan: row._id.plan, subscribers: row.value })),
    };
};
exports.fetchReportsAnalytics = fetchReportsAnalytics;
const reportRows = (type, analytics) => {
    if (type === "platform_churn")
        return analytics.platformChurn.map((row) => ({ Date: row.date, ChurnedUsers: row.value }));
    if (type === "user_acquisition")
        return analytics.userAcquisition.map((row) => ({ Date: row.date, NewUsers: row.value }));
    if (type === "daily_active_users")
        return analytics.dailyActiveUsers.map((row) => ({ Date: row.date, ActiveUsers: row.value }));
    if (type === "job_success")
        return Object.entries(analytics.jobSuccess.breakdown).map(([status, count]) => ({ Status: status, Jobs: Number(count) }));
    if (type === "material_sales")
        return analytics.materialSales.map((row) => ({ Category: row.category, ItemsSold: row.itemsSold, SalesValue: row.salesValue }));
    return analytics.subscriptionPerformance.map((row) => ({ Month: row.month, Plan: row.plan, Subscribers: row.subscribers }));
};
const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const exportReport = async (type, format, startDate, endDate) => {
    const analytics = await (0, exports.fetchReportsAnalytics)(startDate, endDate);
    const rows = reportRows(type, analytics);
    const headers = rows.length ? Object.keys(rows[0]) : ["Result"];
    const title = type.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
    const filename = `${type}-${analytics.range.startDate}-${analytics.range.endDate}.${format}`;
    if (format === "csv") {
        const content = [headers.map(escapeCsv).join(","), ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","))].join("\n");
        return { filename, contentType: "text/csv; charset=utf-8", body: Buffer.from(content) };
    }
    if (format === "md") {
        const table = rows.length
            ? [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${headers.map((header) => String(row[header] ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)]
            : ["No records found for this date range."];
        return { filename, contentType: "text/markdown; charset=utf-8", body: Buffer.from([`# ${title}`, "", `${analytics.range.startDate} to ${analytics.range.endDate}`, "", ...table].join("\n")) };
    }
    const document = new pdfkit_1.default({ margin: 40, size: "A4" });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    const completed = new Promise((resolve, reject) => {
        document.on("end", () => resolve(Buffer.concat(chunks)));
        document.on("error", reject);
    });
    document.fontSize(18).text(title).moveDown(0.4);
    document.fontSize(10).fillColor("#667085").text(`${analytics.range.startDate} to ${analytics.range.endDate}`).moveDown();
    document.fillColor("#101828");
    if (!rows.length)
        document.text("No records found for this date range.");
    for (const row of rows)
        document.text(headers.map((header) => `${header}: ${row[header] ?? ""}`).join("   ")).moveDown(0.35);
    document.end();
    return { filename, contentType: "application/pdf", body: await completed };
};
exports.exportReport = exportReport;
