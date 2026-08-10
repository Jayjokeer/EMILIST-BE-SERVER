"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDashboardOverview = void 0;
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const project_model_1 = __importDefault(require("../models/project.model"));
const business_model_1 = __importDefault(require("../models/business.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const jobs_enum_1 = require("../enums/jobs.enum");
const project_enum_1 = require("../enums/project.enum");
const job_service_1 = require("./job.service");
const error_1 = require("../errors/error");
const DAY_MS = 24 * 60 * 60 * 1000;
const percentChange = (current, previous) => {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
};
// Milestone due date = job.startDate + cumulative days of all "days"-denominated
// milestones before/including it (same approximation used in job.service.ts).
const computeMilestoneDueDates = (job) => {
    if (!job.startDate)
        return job.milestones.map(() => null);
    let cumulativeDays = 0;
    return job.milestones.map((milestone) => {
        if (milestone.timeFrame?.period === "days") {
            cumulativeDays += parseInt(milestone.timeFrame.number, 10) || 0;
        }
        const due = new Date(job.startDate);
        due.setDate(due.getDate() + cumulativeDays);
        return due;
    });
};
const getNewJobApplications = async (userId) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);
    const count = await project_model_1.default.countDocuments({ creator: userId, status: project_enum_1.ProjectStatusEnum.pending });
    const newToday = await project_model_1.default.countDocuments({ creator: userId, appliedAt: { $gte: todayStart } });
    const newYesterday = await project_model_1.default.countDocuments({
        creator: userId,
        appliedAt: { $gte: yesterdayStart, $lt: todayStart },
    });
    return {
        count,
        newToday,
        percentChangeToday: percentChange(newToday, newYesterday),
    };
};
const getUpcomingPayments = async (userId) => {
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * DAY_MS);
    const jobs = await jobs_model_1.default.find({
        userId,
        status: { $in: [jobs_enum_1.JobStatusEnum.active, jobs_enum_1.JobStatusEnum.paused] },
        startDate: { $ne: null },
    });
    const totalsByCurrency = {};
    for (const job of jobs) {
        const dueDates = computeMilestoneDueDates(job);
        job.milestones.forEach((milestone, index) => {
            if (milestone.paymentStatus !== "unpaid")
                return;
            const dueDate = dueDates[index];
            if (!dueDate || dueDate < now || dueDate > weekAhead)
                return;
            const currency = milestone.currency || job.currency || "NGN";
            totalsByCurrency[currency] = (totalsByCurrency[currency] || 0) + (milestone.amount || 0);
        });
    }
    const currencies = Object.keys(totalsByCurrency);
    const primaryCurrency = currencies[0] || "NGN";
    return {
        amount: totalsByCurrency[primaryCurrency] || 0,
        currency: primaryCurrency,
        totalsByCurrency,
        period: "this week",
    };
};
const getJobCompletionRate = async (userId) => {
    const now = new Date();
    const yesterdayCutoff = new Date(now.getTime() - DAY_MS);
    const totalJobs = await jobs_model_1.default.countDocuments({ userId });
    const completedJobs = await jobs_model_1.default.countDocuments({ userId, status: jobs_enum_1.JobStatusEnum.complete });
    const rate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
    const totalJobsYesterday = await jobs_model_1.default.countDocuments({ userId, createdAt: { $lte: yesterdayCutoff } });
    const completedJobsYesterday = await jobs_model_1.default.countDocuments({
        userId,
        status: jobs_enum_1.JobStatusEnum.complete,
        updatedAt: { $lte: yesterdayCutoff },
    });
    const rateYesterday = totalJobsYesterday > 0 ? (completedJobsYesterday / totalJobsYesterday) * 100 : 0;
    return {
        rate: parseFloat(rate.toFixed(1)),
        // Percentage-point change vs this time yesterday (not a relative %).
        percentChangeToday: parseFloat((rate - rateYesterday).toFixed(1)),
    };
};
const getJobCompletionBreakdown = async (userId) => {
    const counts = await (0, job_service_1.fetchJobCount)(userId);
    const total = counts.totalCompletedJobs +
        counts.totalPendingJobs +
        counts.totalOverdueJobs +
        counts.totalActiveJobs +
        counts.totalPausedJobs;
    const pct = (value) => (total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0);
    return {
        completed: pct(counts.totalCompletedJobs),
        pending: pct(counts.totalPendingJobs),
        overdue: pct(counts.totalOverdueJobs),
        period: "This week",
    };
};
// "Service Provider of the Week" - highest-rated Business profile (min 1 review),
// tie-broken by review count. Not a stored/rotating weekly pick.
const getSpotlight = async (excludeUserId) => {
    const businesses = await business_model_1.default.find({ userId: { $ne: excludeUserId } })
        .select('businessName services expertType userId reviews')
        .populate('userId', 'fullName userName displayImage level')
        .populate('reviews', 'rating');
    let best = null;
    let bestScore = { averageRating: 0, totalReviews: 0 };
    for (const business of businesses) {
        const reviews = business.reviews || [];
        const totalReviews = reviews.length;
        if (totalReviews === 0)
            continue;
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
        const isBetter = averageRating > bestScore.averageRating ||
            (averageRating === bestScore.averageRating && totalReviews > bestScore.totalReviews);
        if (isBetter) {
            best = business;
            bestScore = { averageRating, totalReviews };
        }
    }
    if (!best)
        return null;
    return {
        businessId: best._id,
        businessName: best.businessName,
        services: best.services,
        expertType: best.expertType,
        user: best.userId,
        averageRating: parseFloat(bestScore.averageRating.toFixed(2)),
        totalReviews: bestScore.totalReviews,
    };
};
const fetchDashboardOverview = async (userId) => {
    const user = await users_model_1.default.findById(userId).select('firstName lastName fullName userName uniqueId displayImage');
    if (!user)
        throw new error_1.NotFoundError("User not found");
    const [newJobApplications, upcomingPayments, jobCompletionRate, jobCompletion, spotlight] = await Promise.all([
        getNewJobApplications(userId),
        getUpcomingPayments(userId),
        getJobCompletionRate(userId),
        getJobCompletionBreakdown(userId),
        getSpotlight(userId),
    ]);
    return {
        user,
        newJobApplications,
        upcomingPayments,
        jobCompletionRate,
        jobCompletion,
        spotlight,
    };
};
exports.fetchDashboardOverview = fetchDashboardOverview;
