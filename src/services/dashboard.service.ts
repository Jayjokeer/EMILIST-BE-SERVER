import Jobs from "../models/jobs.model";
import Project from "../models/project.model";
import Business from "../models/business.model";
import Users from "../models/users.model";
import { JobStatusEnum } from "../enums/jobs.enum";
import { ProjectStatusEnum } from "../enums/project.enum";
import { fetchJobCount } from "./job.service";
import { NotFoundError } from "../errors/error";

const DAY_MS = 24 * 60 * 60 * 1000;

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

const getJobCompletionBreakdown = async (userId: string) => {
  const counts = await fetchJobCount(userId);
  const total =
    counts.totalCompletedJobs +
    counts.totalPendingJobs +
    counts.totalOverdueJobs +
    counts.totalActiveJobs +
    counts.totalPausedJobs;

  const pct = (value: number) => (total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0);

  return {
    completed: pct(counts.totalCompletedJobs),
    pending: pct(counts.totalPendingJobs),
    overdue: pct(counts.totalOverdueJobs),
    period: "This week",
  };
};

// "Service Provider of the Week" - highest-rated Business profile (min 1 review),
// tie-broken by review count. Not a stored/rotating weekly pick.
const getSpotlight = async (excludeUserId: string) => {
  const businesses = await Business.find({ userId: { $ne: excludeUserId } })
    .select('businessName services expertType userId reviews')
    .populate('userId', 'fullName userName displayImage level')
    .populate('reviews', 'rating');

  let best: any = null;
  let bestScore = { averageRating: 0, totalReviews: 0 };

  for (const business of businesses) {
    const reviews = (business.reviews as any[]) || [];
    const totalReviews = reviews.length;
    if (totalReviews === 0) continue;
    const averageRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews;

    const isBetter =
      averageRating > bestScore.averageRating ||
      (averageRating === bestScore.averageRating && totalReviews > bestScore.totalReviews);

    if (isBetter) {
      best = business;
      bestScore = { averageRating, totalReviews };
    }
  }

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

export const fetchDashboardOverview = async (userId: string) => {
  const user = await Users.findById(userId).select('firstName lastName fullName userName uniqueId displayImage');
  if (!user) throw new NotFoundError("User not found");

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
