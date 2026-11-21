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
exports.fetchDashboardOverview = exports.summarizeJobCompletion = exports.dashboardPeriodRange = void 0;
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const project_model_1 = __importDefault(require("../models/project.model"));
const business_model_1 = __importDefault(require("../models/business.model"));
const app_config_model_1 = __importDefault(require("../models/app-config.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const jobs_enum_1 = require("../enums/jobs.enum");
const project_enum_1 = require("../enums/project.enum");
const error_1 = require("../errors/error");
const frontend_url_1 = require("../utils/frontend-url");
const config_1 = require("../utils/config");
const subscriptionService = __importStar(require("./subscription.service"));
const plan_enum_1 = require("../enums/plan.enum");
const DAY_MS = 24 * 60 * 60 * 1000;
const dashboardPeriodRange = (period, now = new Date()) => {
    if (period === "all")
        return { startDate: null, endDate: now, label: "All time" };
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    if (period === "week") {
        const mondayOffset = (startDate.getDay() + 6) % 7;
        startDate.setDate(startDate.getDate() - mondayOffset);
    }
    else if (period === "month") {
        startDate.setDate(1);
    }
    else {
        startDate.setMonth(0, 1);
    }
    return {
        startDate,
        endDate: now,
        label: period === "week" ? "This week" : period === "month" ? "This month" : "This year",
    };
};
exports.dashboardPeriodRange = dashboardPeriodRange;
const summarizeJobCompletion = (statuses) => {
    const counts = statuses.reduce((summary, status) => {
        if (status === jobs_enum_1.JobStatusEnum.complete)
            summary.completed += 1;
        else if (status === jobs_enum_1.JobStatusEnum.overdue)
            summary.overdue += 1;
        else if (status !== jobs_enum_1.JobStatusEnum.cancelled && status !== jobs_enum_1.JobStatusEnum.draft)
            summary.pending += 1;
        return summary;
    }, { completed: 0, pending: 0, overdue: 0 });
    const total = counts.completed + counts.pending + counts.overdue;
    const percentage = (value) => total ? Number(((value / total) * 100).toFixed(1)) : 0;
    return {
        counts: { ...counts, total },
        percentages: {
            completed: percentage(counts.completed),
            pending: percentage(counts.pending),
            overdue: percentage(counts.overdue),
        },
    };
};
exports.summarizeJobCompletion = summarizeJobCompletion;
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
const getJobCompletionBreakdown = async (userId, period) => {
    const range = (0, exports.dashboardPeriodRange)(period);
    const filter = { userId };
    if (range.startDate)
        filter.createdAt = { $gte: range.startDate, $lte: range.endDate };
    const jobs = await jobs_model_1.default.find(filter).select("status").lean();
    const summary = (0, exports.summarizeJobCompletion)(jobs.map((job) => String(job.status)));
    return {
        ...summary.percentages,
        counts: summary.counts,
        period,
        periodLabel: range.label,
        range: { startDate: range.startDate, endDate: range.endDate },
        availablePeriods: ["week", "month", "year", "all"],
    };
};
// "Service Provider of the Week" - highest-rated Business profile (min 1 review),
// tie-broken by review count. Not a stored/rotating weekly pick.
const getSpotlight = async (excludeUserId) => {
    const config = await app_config_model_1.default.findOne().select("spotlightExpertUserId").lean();
    const selectedUserId = config?.spotlightExpertUserId;
    const selectedIsVisible = selectedUserId && String(selectedUserId) !== String(excludeUserId);
    let businesses = await business_model_1.default.find(selectedIsVisible ? { userId: selectedUserId } : { userId: { $ne: excludeUserId } })
        .select('businessName services expertType userId reviews')
        .populate('userId', 'fullName userName displayImage level')
        .populate('reviews', 'rating');
    // A removed configured profile must not leave the dashboard without its
    // existing highest-rated fallback.
    if (selectedIsVisible && !businesses.length) {
        businesses = await business_model_1.default.find({ userId: { $ne: excludeUserId } })
            .select('businessName services expertType userId reviews')
            .populate('userId', 'fullName userName displayImage level')
            .populate('reviews', 'rating');
    }
    let best = null;
    let bestScore = { averageRating: 0, totalReviews: 0 };
    for (const business of businesses) {
        const reviews = business.reviews || [];
        const totalReviews = reviews.length;
        if (totalReviews === 0 && !selectedIsVisible)
            continue;
        const averageRating = totalReviews
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;
        const isBetter = averageRating > bestScore.averageRating ||
            (averageRating === bestScore.averageRating && totalReviews > bestScore.totalReviews);
        if (isBetter) {
            best = business;
            bestScore = { averageRating, totalReviews };
        }
    }
    if (!best && businesses.length)
        best = businesses[0];
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
const fetchDashboardOverview = async (userId, period = "week") => {
    const user = await users_model_1.default.findById(userId).select('firstName lastName fullName userName uniqueId displayImage email isPrimeMember invitedUsers sharedCount');
    if (!user)
        throw new error_1.NotFoundError("User not found");
    const [newJobApplications, upcomingPayments, jobCompletionRate, jobCompletion, spotlight, subscription] = await Promise.all([
        getNewJobApplications(userId),
        getUpcomingPayments(userId),
        getJobCompletionRate(userId),
        getJobCompletionBreakdown(userId, period),
        getSpotlight(userId),
        subscriptionService.getActiveSubscription(userId),
    ]);
    const displayName = user.firstName || user.fullName || user.userName || user.email.split("@")[0];
    const plan = subscription?.planId?.name || plan_enum_1.PlanEnum.basic;
    const referralLink = (0, frontend_url_1.buildFrontendUrl)(config_1.config.frontendUrl, {
        path: "/sign-up",
        query: { referralCode: String(user.uniqueId) },
    });
    return {
        generatedAt: new Date(),
        user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            userName: user.userName,
            uniqueId: user.uniqueId,
            displayImage: user.displayImage,
            greetingName: displayName,
        },
        subscription: {
            planName: plan,
            status: subscription?.status || null,
            isPro: Boolean(user.isPrimeMember || plan !== plan_enum_1.PlanEnum.basic),
        },
        newJobApplications,
        upcomingPayments,
        jobCompletionRate,
        jobCompletion,
        spotlight,
        referral: {
            code: user.uniqueId,
            link: referralLink,
            qrValue: referralLink,
            invitedCount: user.invitedUsers?.length || 0,
            sharedCount: user.sharedCount || 0,
            shareText: `Join me on Emilist: ${referralLink}`,
        },
    };
};
exports.fetchDashboardOverview = fetchDashboardOverview;
