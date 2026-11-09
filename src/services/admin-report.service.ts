import PDFDocument from "pdfkit";
import Users from "../models/users.model";
import Jobs from "../models/jobs.model";
import Order from "../models/order.model";
import Subscription from "../models/subscription.model";
import Transaction from "../models/transaction.model";
import { BadRequestError } from "../errors/error";

export type AdminReportType = "platform_churn" | "user_acquisition" | "job_success" | "daily_active_users" | "material_sales" | "subscription_performance";
export type AdminReportFormat = "pdf" | "csv" | "md";

const DAY = 24 * 60 * 60 * 1000;
const dateKey = (value: Date | string) => new Date(value).toISOString().slice(0, 10);

const boundaryDate = (value: string | Date, endOfDay: boolean) => {
  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  parsed.setUTCHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return parsed;
};

const parseRange = (startDate?: string | Date, endDate?: string | Date) => {
  const end = endDate ? boundaryDate(endDate, true) : new Date();
  const start = startDate ? boundaryDate(startDate, false) : boundaryDate(new Date(end.getTime() - (29 * DAY)), false);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) throw new BadRequestError("Invalid report date range");
  if (end.getTime() - start.getTime() > 366 * DAY) throw new BadRequestError("Report range cannot exceed 366 days");
  return { start, end };
};

const fillDaily = (start: Date, end: Date, rows: any[], valueField = "value") => {
  const values = new Map(rows.map((row) => [String(row._id), Number(row[valueField] || 0)]));
  const result: Array<{ date: string; value: number }> = [];
  for (let cursor = new Date(start); cursor <= end; cursor = new Date(cursor.getTime() + DAY)) {
    const date = dateKey(cursor);
    result.push({ date, value: values.get(date) || 0 });
  }
  return result;
};

const dailyCount = (model: any, field: string, match: Record<string, unknown>, start: Date, end: Date) => model.aggregate([
  { $match: { ...match, [field]: { $gte: start, $lte: end } } },
  { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: `$${field}`, timezone: "UTC" } }, value: { $sum: 1 } } },
  { $sort: { _id: 1 } },
]);

const dailyUsers = (model: any, userField: string, start: Date, end: Date) => model.aggregate([
  { $match: { createdAt: { $gte: start, $lte: end }, [userField]: { $ne: null } } },
  { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, userId: `$${userField}` } } },
  { $group: { _id: "$_id.date", users: { $addToSet: "$_id.userId" } } },
]);

export const fetchReportsAnalytics = async (startDate?: string | Date, endDate?: string | Date) => {
  const { start, end } = parseRange(startDate, endDate);
  const [acquisitionRows, churnRows, jobActivity, orderActivity, transactionActivity, subscriptionActivity, jobRows, materialRows, subscriptionRows] = await Promise.all([
    dailyCount(Users, "createdAt", {}, start, end),
    dailyCount(Users, "updatedAt", { status: { $ne: "Active" } }, start, end),
    dailyUsers(Jobs, "userId", start, end),
    dailyUsers(Order, "userId", start, end),
    dailyUsers(Transaction, "userId", start, end),
    dailyUsers(Subscription, "userId", start, end),
    Jobs.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$status", value: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, paymentStatus: "paid" } },
      { $unwind: "$products" },
      { $group: { _id: { $ifNull: ["$products.categoryName", "Uncategorised"] }, itemsSold: { $sum: "$products.quantity" }, salesValue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } } } },
      { $sort: { itemsSold: -1 } },
    ]),
    Subscription.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $lookup: { from: "plans", localField: "planId", foreignField: "_id", as: "plan" } },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      { $group: { _id: { month: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" } }, plan: { $ifNull: ["$plan.name", "Unknown"] } }, value: { $sum: 1 } } },
      { $sort: { "_id.month": 1, "_id.plan": 1 } },
    ]),
  ]);

  const jobCounts: Record<string, number> = {};
  for (const row of jobRows) jobCounts[String(row._id || "unknown")] = Number(row.value || 0);
  const totalJobs = Object.values(jobCounts).reduce((sum, value) => sum + value, 0);
  const completedJobs = jobCounts.completed || 0;
  const activeByDate = new Map<string, Set<string>>();
  for (const row of [...jobActivity, ...orderActivity, ...transactionActivity, ...subscriptionActivity]) {
    const users = activeByDate.get(String(row._id)) || new Set<string>();
    for (const userId of row.users || []) users.add(String(userId));
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

const reportRows = (type: AdminReportType, analytics: any): Array<Record<string, string | number>> => {
  if (type === "platform_churn") return analytics.platformChurn.map((row: any) => ({ Date: row.date, ChurnedUsers: row.value }));
  if (type === "user_acquisition") return analytics.userAcquisition.map((row: any) => ({ Date: row.date, NewUsers: row.value }));
  if (type === "daily_active_users") return analytics.dailyActiveUsers.map((row: any) => ({ Date: row.date, ActiveUsers: row.value }));
  if (type === "job_success") return Object.entries(analytics.jobSuccess.breakdown).map(([status, count]) => ({ Status: status, Jobs: Number(count) }));
  if (type === "material_sales") return analytics.materialSales.map((row: any) => ({ Category: row.category, ItemsSold: row.itemsSold, SalesValue: row.salesValue }));
  return analytics.subscriptionPerformance.map((row: any) => ({ Month: row.month, Plan: row.plan, Subscribers: row.subscribers }));
};

const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export const exportReport = async (type: AdminReportType, format: AdminReportFormat, startDate?: string | Date, endDate?: string | Date) => {
  const analytics = await fetchReportsAnalytics(startDate, endDate);
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

  const document = new PDFDocument({ margin: 40, size: "A4" });
  const chunks: Buffer[] = [];
  document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const completed = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });
  document.fontSize(18).text(title).moveDown(0.4);
  document.fontSize(10).fillColor("#667085").text(`${analytics.range.startDate} to ${analytics.range.endDate}`).moveDown();
  document.fillColor("#101828");
  if (!rows.length) document.text("No records found for this date range.");
  for (const row of rows) document.text(headers.map((header) => `${header}: ${row[header] ?? ""}`).join("   ")).moveDown(0.35);
  document.end();
  return { filename, contentType: "application/pdf", body: await completed };
};
