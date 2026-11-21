import Jobs from "../models/jobs.model";
import Project from "../models/project.model";
import Business from "../models/business.model";
import AppConfig from "../models/app-config.model";
import Users from "../models/users.model";
import { JobStatusEnum } from "../enums/jobs.enum";
import { ProjectStatusEnum } from "../enums/project.enum";
import { NotFoundError } from "../errors/error";
import { buildFrontendUrl } from "../utils/frontend-url";
import { config } from "../utils/config";
import * as subscriptionService from "./subscription.service";
import { PlanEnum } from "../enums/plan.enum";

const DAY_MS = 24 * 60 * 60 * 1000;
export type DashboardPeriod = "week" | "month" | "year" | "all";

export const dashboardPeriodRange = (period: DashboardPeriod, now = new Date()) => {
  if (period === "all") return { startDate: null, endDate: now, label: "All time" };
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);
  if (period === "week") {
    const mondayOffset = (startDate.getDay() + 6) % 7;
    startDate.setDate(startDate.getDate() - mondayOffset);
  } else if (period === "month") {
    startDate.setDate(1);
  } else {
    startDate.setMonth(0, 1);
  }
  return {
    startDate,
    endDate: now,
    label: period === "week" ? "This week" : period === "month" ? "This month" : "This year",
  };
};

export const summarizeJobCompletion = (statuses: string[]) => {
  const counts = statuses.reduce(
    (summary, status) => {
      if (status === JobStatusEnum.complete) summary.completed += 1;
      else if (status === JobStatusEnum.overdue) summary.overdue += 1;
      else if (status !== JobStatusEnum.cancelled && status !== JobStatusEnum.draft) summary.pending += 1;
      return summary;
    },
    { completed: 0, pending: 0, overdue: 0 },
  );
  const total = counts.completed + counts.pending + counts.overdue;
  const percentage = (value: number) => total ? Number(((value / total) * 100).toFixed(1)) : 0;
  return {
    counts: { ...counts, total },
    percentages: {
      completed: percentage(counts.completed),
      pending: percentage(counts.pending),
      overdue: percentage(counts.overdue),
    },
  };
};

const percentChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
};

// Milestone due date = job.startDate + cumulative days of all "days"-denominated
// milestones before/including it (same approximation used in job.service.ts).
const computeMilestoneDueDates = (job: any): Date[] => {
  if (!job.startDate) return job.milestones.map(() => null);
  let cumulativeDays = 0;
  return job.milestones.map((milestone: any) => {
    if (milestone.timeFrame?.period === "days") {
      cumulativeDays += parseInt(milestone.timeFrame.number, 10) || 0;
    }
    const due = new Date(job.startDate);
    due.setDate(due.getDate() + cumulativeDays);
    return due;
  });
};

const getNewJobApplications = async (userId: string) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);

  const count = await Project.countDocuments({ creator: userId, status: ProjectStatusEnum.pending });
  const newToday = await Project.countDocuments({ creator: userId, appliedAt: { $gte: todayStart } });
  const newYesterday = await Project.countDocuments({
    creator: userId,
    appliedAt: { $gte: yesterdayStart, $lt: todayStart },
  });

  return {
    count,
    newToday,
    percentChangeToday: percentChange(newToday, newYesterday),
  };
};

const getUpcomingPayments = async (userId: string) => {
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * DAY_MS);

  const jobs = await Jobs.find({
    userId,
    status: { $in: [JobStatusEnum.active, JobStatusEnum.paused] },
    startDate: { $ne: null },
  });

  const totalsByCurrency: Record<string, number> = {};

  for (const job of jobs) {
    const dueDates = computeMilestoneDueDates(job);
    job.milestones.forEach((milestone: any, index: number) => {
      if (milestone.paymentStatus !== "unpaid") return;
      const dueDate = dueDates[index];
      if (!dueDate || dueDate < now || dueDate > weekAhead) return;
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

const getJobCompletionRate = async (userId: string) => {
  const now = new Date();
  const yesterdayCutoff = new Date(now.getTime() - DAY_MS);

  const totalJobs = await Jobs.countDocuments({ userId });
  const completedJobs = await Jobs.countDocuments({ userId, status: JobStatusEnum.complete });
  const rate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  const totalJobsYesterday = await Jobs.countDocuments({ userId, createdAt: { $lte: yesterdayCutoff } });
  const completedJobsYesterday = await Jobs.countDocuments({
    userId,
    status: JobStatusEnum.complete,
    updatedAt: { $lte: yesterdayCutoff },
  });
  const rateYesterday = totalJobsYesterday > 0 ? (completedJobsYesterday / totalJobsYesterday) * 100 : 0;

  return {
    rate: parseFloat(rate.toFixed(1)),
    // Percentage-point change vs this time yesterday (not a relative %).
    percentChangeToday: parseFloat((rate - rateYesterday).toFixed(1)),
  };
};

const getJobCompletionBreakdown = async (userId: string, period: DashboardPeriod) => {
  const range = dashboardPeriodRange(period);
  const filter: Record<string, unknown> = { userId };
  if (range.startDate) filter.createdAt = { $gte: range.startDate, $lte: range.endDate };
  const jobs = await Jobs.find(filter).select("status").lean();
  const summary = summarizeJobCompletion(jobs.map((job: any) => String(job.status)));
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
const getSpotlight = async (excludeUserId: string) => {
  const config = await AppConfig.findOne().select("spotlightExpertUserId").lean();
  const selectedUserId = (config as any)?.spotlightExpertUserId;
  const selectedIsVisible = selectedUserId && String(selectedUserId) !== String(excludeUserId);
  let businesses = await Business.find(selectedIsVisible ? { userId: selectedUserId } : { userId: { $ne: excludeUserId } })
    .select('businessName services expertType userId reviews')
    .populate('userId', 'fullName userName displayImage level')
    .populate('reviews', 'rating');

  // A removed configured profile must not leave the dashboard without its
  // existing highest-rated fallback.
  if (selectedIsVisible && !businesses.length) {
    businesses = await Business.find({ userId: { $ne: excludeUserId } })
      .select('businessName services expertType userId reviews')
      .populate('userId', 'fullName userName displayImage level')
      .populate('reviews', 'rating');
  }

  let best: any = null;
  let bestScore = { averageRating: 0, totalReviews: 0 };

  for (const business of businesses) {
    const reviews = (business.reviews as any[]) || [];
    const totalReviews = reviews.length;
    if (totalReviews === 0 && !selectedIsVisible) continue;
    const averageRating = totalReviews
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
      : 0;

    const isBetter =
      averageRating > bestScore.averageRating ||
      (averageRating === bestScore.averageRating && totalReviews > bestScore.totalReviews);

    if (isBetter) {
      best = business;
      bestScore = { averageRating, totalReviews };
    }
  }

  if (!best && businesses.length) best = businesses[0];
  if (!best) return null;

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

export const fetchDashboardOverview = async (userId: string, period: DashboardPeriod = "week") => {
  const user = await Users.findById(userId).select('firstName lastName fullName userName uniqueId displayImage email isPrimeMember invitedUsers sharedCount');
  if (!user) throw new NotFoundError("User not found");

  const [newJobApplications, upcomingPayments, jobCompletionRate, jobCompletion, spotlight, subscription] = await Promise.all([
    getNewJobApplications(userId),
    getUpcomingPayments(userId),
    getJobCompletionRate(userId),
    getJobCompletionBreakdown(userId, period),
    getSpotlight(userId),
    subscriptionService.getActiveSubscription(userId),
  ]);

  const displayName = user.firstName || user.fullName || user.userName || user.email.split("@")[0];
  const plan = (subscription?.planId as any)?.name || PlanEnum.basic;
  const referralLink = buildFrontendUrl(config.frontendUrl, {
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
      isPro: Boolean(user.isPrimeMember || plan !== PlanEnum.basic),
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
