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
exports.fetchJobsByUserId = exports.fetchAllRecurringJobs = exports.activePendingJobs = exports.findRecurringJobsWithReminders = exports.findRecurringJobsDue = exports.createRecurringJob = exports.updateMilestone = exports.fetchJobLeads = exports.fetchAllLikedJobs = exports.fetchAllJobsAdmin = exports.fetchAllUserJobsAdmin = exports.fetchAllJobsForAdminDashboard = exports.projectAnalytics = exports.fetchProjectCounts = exports.fetchJobCount = exports.jobAnalytics = exports.fetchUserApplications = exports.fetchUserJobApplications = exports.fetchJobByUserIdAndStatus = exports.deleteJobById = exports.deleteJobApplication = exports.unlikeJob = exports.fetchLikedJobs = exports.createJobLike = exports.ifLikedJob = exports.fetchJobByIdWithDetails = exports.fetchJobByIdWithUserId = exports.fetchJobById = exports.fetchAllJobs = exports.fetchAllUserJobs = exports.createJob = void 0;
const jobs_model_1 = __importDefault(require("../models/jobs.model"));
const joblike_model_1 = __importDefault(require("../models/joblike.model"));
const project_model_1 = __importDefault(require("../models/project.model"));
const error_1 = require("../errors/error");
const jobs_enum_1 = require("../enums/jobs.enum");
const project_enum_1 = require("../enums/project.enum");
const date_fns_1 = require("date-fns");
const moment_1 = __importDefault(require("moment"));
const userService = __importStar(require("./auth.service"));
const business_model_1 = __importDefault(require("../models/business.model"));
const recurring_job_model_1 = __importDefault(require("../models/recurring-job.model"));
const createJob = async (data) => {
    return await jobs_model_1.default.create(data);
};
exports.createJob = createJob;
const fetchAllUserJobs = async (userId, page, limit, search = null, filters = {}) => {
    const skip = (page - 1) * limit;
    const searchCriteria = { userId };
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        const jobSchemaPaths = jobs_model_1.default.schema.paths;
        const stringFields = Object.keys(jobSchemaPaths).filter((field) => jobSchemaPaths[field].instance === 'String');
        searchCriteria.$or = stringFields.map((field) => ({ [field]: { $regex: searchRegex } }));
    }
    else {
        if (filters.title)
            searchCriteria.title = { $regex: new RegExp(filters.title, 'i') };
        if (filters.location)
            searchCriteria.location = { $regex: new RegExp(filters.location, 'i') };
        if (filters.category)
            searchCriteria.category = { $regex: new RegExp(filters.category, 'i') };
        if (filters.service)
            searchCriteria.service = { $regex: new RegExp(filters.service, 'i') };
    }
    const jobs = await jobs_model_1.default.find(searchCriteria).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalJobs = await jobs_model_1.default.countDocuments(searchCriteria);
    return {
        jobs,
        totalPages: Math.ceil(totalJobs / limit),
        currentPage: page,
        totalJobs,
    };
};
exports.fetchAllUserJobs = fetchAllUserJobs;
const fetchAllJobs = async (page, limit, userId, search, filters = {}) => {
    const skip = (page - 1) * limit;
    const searchCriteria = {
        type: { $ne: jobs_enum_1.JobType.direct },
        status: jobs_enum_1.JobStatusEnum.pending,
    };
    if (!search) {
        if (filters.title)
            searchCriteria.title = { $regex: new RegExp(filters.title, 'i') };
        if (filters.location)
            searchCriteria.location = { $regex: new RegExp(filters.location, 'i') };
        if (filters.category)
            searchCriteria.category = { $regex: new RegExp(filters.category, 'i') };
        if (filters.service)
            searchCriteria.service = { $regex: new RegExp(filters.service, 'i') };
        if (filters.description)
            searchCriteria.description = { $regex: new RegExp(filters.description, 'i') };
    }
    if (userId) {
        const user = await userService.fetchUserMutedJobs(userId);
        if (user && user.mutedJobs && user.mutedJobs.length > 0) {
            searchCriteria._id = { $nin: user.mutedJobs };
        }
    }
    let jobsQuery;
    let totalJobs;
    if (search) {
        const words = search.trim().split(/\s+/);
        const regexList = words.map((word) => new RegExp(word, 'i'));
        const orConditions = [];
        const jobFields = ['title', 'location', 'category', 'service', 'description'];
        regexList.forEach((regex) => {
            jobFields.forEach((field) => {
                orConditions.push({ [field]: { $regex: regex } });
            });
            orConditions.push({ 'userId.userName': { $regex: regex } });
            orConditions.push({ 'userId.fullName': { $regex: regex } });
        });
        jobsQuery = await jobs_model_1.default.find({
            ...searchCriteria,
            $or: orConditions,
        })
            .populate({
            path: 'userId',
            select: 'userName fullName',
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        totalJobs = await jobs_model_1.default.countDocuments({ ...searchCriteria,
            $or: orConditions,
        });
    }
    else {
        jobsQuery = await jobs_model_1.default.find(searchCriteria)
            .populate('userId', 'userName fullName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        totalJobs = await jobs_model_1.default.countDocuments(searchCriteria);
    }
    const jobs = jobsQuery;
    let jobsWithLikeStatus;
    if (userId) {
        const likedJobs = await joblike_model_1.default.find({ user: userId }).select('job').lean();
        const likedJobIds = likedJobs.map((like) => like.job.toString());
        jobsWithLikeStatus = jobs.map((job) => ({
            ...job.toObject(),
            liked: likedJobIds.includes(job._id.toString()),
        }));
    }
    else {
        jobsWithLikeStatus = jobs.map((job) => ({
            ...job.toObject(),
            liked: false,
        }));
    }
    return {
        jobs: jobsWithLikeStatus,
        totalPages: Math.ceil(totalJobs / limit),
        currentPage: page,
        totalJobs,
    };
};
exports.fetchAllJobs = fetchAllJobs;
const fetchJobById = async (jobId) => {
    return await jobs_model_1.default.findById(jobId);
};
exports.fetchJobById = fetchJobById;
const fetchJobByIdWithUserId = async (jobId) => {
    return await jobs_model_1.default.findById(jobId)
        .populate({
        path: 'acceptedApplicationId',
        populate: { path: 'user', select: '_id' }
    });
};
exports.fetchJobByIdWithUserId = fetchJobByIdWithUserId;
const fetchJobByIdWithDetails = async (jobId) => {
    const job = await jobs_model_1.default.findById(jobId)
        .populate('userId', 'fullName userName email location level profileImage')
        .populate({
        path: 'applications',
        populate: { path: 'user', select: 'fullName userName email location level profileImage' },
    });
    if (!job)
        throw new error_1.NotFoundError("Job not found!");
    const creatorId = job.userId;
    const totalJobsPosted = await jobs_model_1.default.countDocuments({ userId: creatorId });
    const totalArtisansHired = await project_model_1.default.countDocuments({
        creator: creatorId,
        status: 'accepted',
    });
    let milestones = [];
    let jobDueDate = null;
    if (job.startDate && (job.status === 'active' || job.status === 'paused')) {
        let cumulativeDays = 0;
        for (const milestone of job.milestones) {
            if (milestone.timeFrame.period === 'days') {
                cumulativeDays += parseInt(milestone.timeFrame.number, 10);
            }
        }
        jobDueDate = (0, date_fns_1.add)(job.startDate, { days: cumulativeDays });
        milestones = job.milestones.map((milestone) => ({
            ...milestone.toObject(),
            dueDate: (0, date_fns_1.add)(job.startDate, { days: cumulativeDays }),
        }));
    }
    else {
        milestones = job.milestones;
    }
    return {
        job: {
            ...job.toObject(),
            dueDate: jobDueDate,
            milestones: milestones,
        },
        totalJobsPosted,
        totalArtisansHired,
    };
};
exports.fetchJobByIdWithDetails = fetchJobByIdWithDetails;
const ifLikedJob = async (jobId, userId) => {
    return await joblike_model_1.default.findOne({ job: jobId, user: userId });
};
exports.ifLikedJob = ifLikedJob;
const createJobLike = async (data) => {
    return await joblike_model_1.default.create(data);
};
exports.createJobLike = createJobLike;
const fetchLikedJobs = async (userId, page, limit) => {
    const skip = (page - 1) * limit;
    const likedJobs = await joblike_model_1.default.find({ user: userId }).select('job').lean();
    const likedJobIds = likedJobs.map((like) => like.job);
    const jobs = await jobs_model_1.default.find({ _id: { $in: likedJobIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const totalLikedJobs = likedJobIds.length;
    return {
        jobs,
        totalPages: Math.ceil(totalLikedJobs / limit),
        currentPage: page,
        totalLikedJobs,
    };
};
exports.fetchLikedJobs = fetchLikedJobs;
const unlikeJob = async (jobId, userId) => {
    return await joblike_model_1.default.findOneAndDelete({ user: userId, job: jobId });
};
exports.unlikeJob = unlikeJob;
const deleteJobApplication = async (jobId, projectId) => {
    return await jobs_model_1.default.updateOne({ _id: jobId }, { $pull: { applications: projectId } });
};
exports.deleteJobApplication = deleteJobApplication;
const deleteJobById = async (jobId, userId) => {
    return await jobs_model_1.default.findOneAndDelete({ userId: userId, _id: jobId });
};
exports.deleteJobById = deleteJobById;
const fetchJobByUserIdAndStatus = async (userId, status) => {
    const query = { userId };
    if (Array.isArray(status)) {
        query.status = { $in: status };
    }
    else {
        query.status = status;
    }
    return await jobs_model_1.default.find(query);
};
exports.fetchJobByUserIdAndStatus = fetchJobByUserIdAndStatus;
const fetchUserJobApplications = async (userId, skip, limit, status, page, search = null, filters = {}) => {
    const userProjects = await project_model_1.default.find({ user: userId }).select('_id');
    const projectIds = userProjects.map((project) => project._id);
    let query = { applications: { $in: projectIds } };
    if (status) {
        query.status = status;
        if (status === jobs_enum_1.JobStatusEnum.active || status === 'overdue') {
            query = { acceptedApplicationId: { $in: projectIds }, status: jobs_enum_1.JobStatusEnum.active };
        }
    }
    if (search) {
        const searchRegex = new RegExp(search, 'i');
        const jobSchemaPaths = jobs_model_1.default.schema.paths;
        const stringFields = Object.keys(jobSchemaPaths).filter((field) => jobSchemaPaths[field].instance === 'String');
        query.$or = stringFields.map((field) => ({ [field]: { $regex: searchRegex } }));
    }
    else {
        if (filters.title)
            query.title = { $regex: new RegExp(filters.title, 'i') };
        if (filters.location)
            query.location = { $regex: new RegExp(filters.location, 'i') };
        if (filters.category)
            query.category = { $regex: new RegExp(filters.category, 'i') };
        if (filters.service)
            query.service = { $regex: new RegExp(filters.service, 'i') };
    }
    const userApplications = await jobs_model_1.default.find(query)
        .populate('applications', 'title description status')
        .sort({ createdAt: -1 });
    const applicationsWithDueDates = await Promise.all(userApplications.map(async (job) => {
        if (job.status !== jobs_enum_1.JobStatusEnum.active && job.status !== jobs_enum_1.JobStatusEnum.paused) {
            return job.toObject();
        }
        let accumulatedTime = job.startDate?.getTime();
        let milestoneDueDate = null;
        const totalMilestones = job.milestones.length;
        let completedMilestones = 0;
        job.milestones.forEach((milestone) => {
            const timeMultiplier = milestone.timeFrame.period === 'days' ? 86400000 : 604800000;
            const milestoneDuration = milestone.timeFrame.number * timeMultiplier;
            accumulatedTime += milestoneDuration;
            if (milestone.status === jobs_enum_1.MilestoneEnum.active ||
                milestone.status === jobs_enum_1.MilestoneEnum.completed) {
                completedMilestones += 1;
            }
            if ((milestone.status === jobs_enum_1.MilestoneEnum.active ||
                milestone.status === jobs_enum_1.MilestoneEnum.paused) &&
                !milestoneDueDate) {
                milestoneDueDate = new Date(accumulatedTime);
            }
        });
        const milestoneProgress = `${completedMilestones}/${totalMilestones}`;
        const overallDueDate = new Date(accumulatedTime);
        return {
            ...job.toObject(),
            milestoneDueDate,
            overallDueDate,
            milestoneProgress,
        };
    }));
    const filteredApplications = applicationsWithDueDates.filter((job) => {
        if (status === jobs_enum_1.JobStatusEnum.active) {
            return job.overallDueDate > new Date();
        }
        if (status === 'overdue') {
            return job.overallDueDate <= new Date();
        }
        return true;
    });
    const totalApplications = filteredApplications.length;
    const paginatedApplications = filteredApplications.slice(skip, skip + limit);
    return {
        total: totalApplications,
        page,
        limit,
        applications: paginatedApplications,
    };
};
exports.fetchUserJobApplications = fetchUserJobApplications;
const fetchUserApplications = async (userId, skip, limit, status, page) => {
    const userProjects = await project_model_1.default.find({ user: userId,
        status: status,
    }).select('_id');
    const projectIds = userProjects.map((project) => project._id);
    const userApplications = await jobs_model_1.default.find({
        applications: { $in: projectIds },
    })
        .populate('applications', 'title description status')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });
    const totalApplications = await jobs_model_1.default.countDocuments({
        applications: { $in: projectIds },
    });
    return {
        total: totalApplications,
        page: Number(page),
        limit: Number(limit),
        applications: userApplications,
    };
};
exports.fetchUserApplications = fetchUserApplications;
const jobAnalytics = async (year = (0, moment_1.default)().year(), month, startDate, endDate, userId) => {
    let start, end;
    if (startDate && endDate) {
        start = (0, moment_1.default)(startDate);
        end = (0, moment_1.default)(endDate);
        if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
            throw new error_1.BadRequestError('Invalid date range');
        }
    }
    else if (year && month) {
        start = (0, moment_1.default)(`${year}-${month}-01`);
        end = start.clone().endOf('month');
    }
    else if (year) {
        start = (0, moment_1.default)(`${year}-01-01`);
        end = (0, moment_1.default)(`${year}-12-31`);
    }
    else {
        throw new error_1.BadRequestError('Year is required');
    }
    const dateRange = [];
    let currentDate = start.clone();
    const interval = month ? 'days' : 'months';
    while (currentDate.isSameOrBefore(end)) {
        dateRange.push(currentDate.clone());
        currentDate = currentDate.add(1, interval);
    }
    const analyticsData = await Promise.all(dateRange.map(async (date) => {
        const dayStart = date.startOf(interval).toDate();
        const dayEnd = date.endOf(interval).toDate();
        const jobs = await jobs_model_1.default.aggregate([
            {
                $match: {
                    userId,
                    createdAt: { $gte: dayStart, $lt: dayEnd },
                },
            },
            {
                $facet: {
                    totalJobs: [{ $count: 'count' }],
                    totalActiveJobs: [
                        { $match: { status: jobs_enum_1.JobStatusEnum.active } },
                        { $count: 'count' },
                    ],
                    totalOverdueJobs: [
                        {
                            $match: {
                                status: { $ne: jobs_enum_1.JobStatusEnum.complete },
                                'milestones.timeFrame': { $lt: new Date() },
                            },
                        },
                        { $count: 'count' },
                    ],
                    totalPausedJobs: [
                        { $match: { status: jobs_enum_1.JobStatusEnum.paused } },
                        { $count: 'count' },
                    ],
                    totalCompletedJobs: [
                        { $match: { status: jobs_enum_1.JobStatusEnum.complete } },
                        { $count: 'count' },
                    ],
                },
            },
            {
                $project: {
                    totalJobs: { $arrayElemAt: ['$totalJobs.count', 0] },
                    totalActiveJobs: { $arrayElemAt: ['$totalActiveJobs.count', 0] },
                    totalOverdueJobs: { $arrayElemAt: ['$totalOverdueJobs.count', 0] },
                    totalPausedJobs: { $arrayElemAt: ['$totalPausedJobs.count', 0] },
                    totalCompletedJobs: { $arrayElemAt: ['$totalCompletedJobs.count', 0] },
                },
            },
        ]);
        return {
            period: date.format(interval === 'months' ? 'MMM YYYY' : 'MMM D, YYYY'),
            totalJobs: jobs[0]?.totalJobs || 0,
            totalActiveJobs: jobs[0]?.totalActiveJobs || 0,
            totalOverdueJobs: jobs[0]?.totalOverdueJobs || 0,
            totalPausedJobs: jobs[0]?.totalPausedJobs || 0,
            totalCompletedJobs: jobs[0]?.totalCompletedJobs || 0,
        };
    }));
    return analyticsData;
};
exports.jobAnalytics = jobAnalytics;
const fetchJobCount = async (userId) => {
    const jobs = await jobs_model_1.default.find({ userId });
    const now = new Date();
    let totalPendingJobs = 0;
    let totalActiveJobs = 0;
    let totalPausedJobs = 0;
    let totalCompletedJobs = 0;
    let totalOverdueJobs = 0;
    jobs.forEach(job => {
        const { status, startDate, milestones } = job;
        if (status === jobs_enum_1.JobStatusEnum.pending)
            totalPendingJobs++;
        if (status === jobs_enum_1.JobStatusEnum.paused)
            totalPausedJobs++;
        if (status === jobs_enum_1.JobStatusEnum.complete)
            totalCompletedJobs++;
        if (status === jobs_enum_1.JobStatusEnum.active && startDate && milestones?.length > 0) {
            let totalDays = 0;
            milestones.forEach((m) => {
                if (m.timeFrame?.period === "days" &&
                    !isNaN(parseInt(m.timeFrame.number))) {
                    totalDays += parseInt(m.timeFrame.number);
                }
            });
            const dueDate = new Date(startDate);
            dueDate.setDate(dueDate.getDate() + totalDays);
            if (dueDate < now) {
                totalOverdueJobs++;
            }
            else {
                totalActiveJobs++;
            }
        }
        else if (status === jobs_enum_1.JobStatusEnum.active) {
            totalActiveJobs++;
        }
    });
    return {
        totalPendingJobs,
        totalActiveJobs,
        totalOverdueJobs,
        totalPausedJobs,
        totalCompletedJobs
    };
};
exports.fetchJobCount = fetchJobCount;
const fetchProjectCounts = async (userId) => {
    const userProjects = await project_model_1.default.find({ user: userId });
    let totalPendingProjects = 0;
    let totalOverdueProjects = 0;
    let totalDueProjects = 0;
    const currentDate = new Date();
    const userProjectIds = userProjects.map((project) => project._id);
    const totalActiveProjectsRaw = await jobs_model_1.default.find({
        acceptedApplicationId: { $in: userProjectIds },
        status: jobs_enum_1.JobStatusEnum.active,
    });
    const totalPausedProjects = await jobs_model_1.default.countDocuments({
        acceptedApplicationId: { $in: userProjectIds },
        status: jobs_enum_1.JobStatusEnum.paused,
    });
    const totalCompletedProjects = await jobs_model_1.default.countDocuments({
        acceptedApplicationId: { $in: userProjectIds },
        status: jobs_enum_1.JobStatusEnum.complete,
    });
    userProjects.forEach((project) => {
        if (project.status == project_enum_1.ProjectStatusEnum.pending) {
            totalPendingProjects++;
        }
    });
    let totalActiveProjects = 0;
    for (const job of totalActiveProjectsRaw) {
        if (!job.startDate || !job.milestones?.length) {
            totalActiveProjects++;
            continue;
        }
        let accumulatedTime = job.startDate.getTime();
        for (const milestone of job.milestones) {
            const timeMultiplier = milestone.timeFrame?.period === "days" ? 86400000 : 604800000;
            const milestoneDuration = (milestone.timeFrame?.number ?? 0) * timeMultiplier;
            accumulatedTime += milestoneDuration;
        }
        const overallDueDate = new Date(accumulatedTime);
        if (overallDueDate <= currentDate) {
            totalOverdueProjects++;
        }
        else {
            totalActiveProjects++;
            const threeDaysAhead = new Date(currentDate.getTime() + 3 * 86400000);
            if (overallDueDate <= threeDaysAhead) {
                totalDueProjects++;
            }
        }
    }
    return {
        totalPendingProjects,
        totalActiveProjects,
        totalPausedProjects,
        totalCompletedProjects,
        totalOverdueProjects,
        totalDueProjects,
    };
};
exports.fetchProjectCounts = fetchProjectCounts;
const projectAnalytics = async (year = (0, moment_1.default)().year(), month, startDate, endDate, userId) => {
    let start, end;
    if (startDate && endDate) {
        start = (0, moment_1.default)(startDate, 'YYYY-MM-DD', true);
        end = (0, moment_1.default)(endDate, 'YYYY-MM-DD', true);
        if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
            throw new error_1.BadRequestError('Invalid date range');
        }
    }
    else if (year && month) {
        start = (0, moment_1.default)(`${year}-${String(month).padStart(2, '0')}-01`, 'YYYY-MM-DD', true);
        end = start.clone().endOf('month');
    }
    else if (year) {
        start = (0, moment_1.default)(`${year}-01-01`, 'YYYY-MM-DD', true);
        end = (0, moment_1.default)(`${year}-12-31`, 'YYYY-MM-DD', true);
    }
    const dateRange = [];
    let currentDate = start.clone();
    const interval = month ? 'days' : 'months';
    while (currentDate.isSameOrBefore(end)) {
        dateRange.push(currentDate.clone());
        currentDate = currentDate.add(1, interval);
    }
    const projects = await project_model_1.default.find({ user: userId }).select('_id');
    const projectIds = projects.map(project => project._id);
    const analyticsData = await Promise.all(dateRange.map(async (date) => {
        const dayStart = date.startOf(interval).toDate();
        const dayEnd = date.endOf(interval).toDate();
        const jobs = await jobs_model_1.default.aggregate([
            {
                $match: {
                    acceptedApplicationId: { $in: projectIds },
                    createdAt: { $gte: dayStart, $lt: dayEnd },
                },
            },
            {
                $facet: {
                    totalProjects: [{ $count: 'count' }],
                    totalActiveProjects: [
                        { $match: { status: jobs_enum_1.JobStatusEnum.active } },
                        { $count: 'count' },
                    ],
                    totalOverdueProjects: [
                        {
                            $match: {
                                status: { $ne: jobs_enum_1.JobStatusEnum.complete },
                                'milestones.timeFrame': { $lt: new Date() },
                            },
                        },
                        { $count: 'count' },
                    ],
                    totalPausedProjects: [
                        { $match: { status: jobs_enum_1.JobStatusEnum.paused } },
                        { $count: 'count' },
                    ],
                    totalCompletedProjects: [
                        { $match: { status: jobs_enum_1.JobStatusEnum.complete } },
                        { $count: 'count' },
                    ],
                },
            },
            {
                $project: {
                    totalProjects: { $arrayElemAt: ['$totalProjects.count', 0] },
                    totalActiveProjects: { $arrayElemAt: ['$totalActiveProjects.count', 0] },
                    totalOverdueProjects: { $arrayElemAt: ['$totalOverdueProjects.count', 0] },
                    totalPausedProjects: { $arrayElemAt: ['$totalPausedProjects.count', 0] },
                    totalCompletedProjects: { $arrayElemAt: ['$totalCompletedProjects.count', 0] },
                },
            },
        ]);
        return {
            period: date.format(interval === 'months' ? 'MMM YYYY' : 'MMM D, YYYY'),
            totalProjects: jobs[0]?.totalProjects || 0,
            totalActiveProjects: jobs[0]?.totalActiveProjects || 0,
            totalOverdueProjects: jobs[0]?.totalOverdueProjects || 0,
            totalPausedProjects: jobs[0]?.totalPausedProjects || 0,
            totalCompletedProjects: jobs[0]?.totalCompletedProjects || 0,
        };
    }));
    return analyticsData;
};
exports.projectAnalytics = projectAnalytics;
const fetchAllJobsForAdminDashboard = async () => {
    return await jobs_model_1.default.countDocuments();
};
exports.fetchAllJobsForAdminDashboard = fetchAllJobsForAdminDashboard;
const fetchAllUserJobsAdmin = async (userId) => {
    return await jobs_model_1.default.find({ userId })
        .sort({ createdAt: -1 })
        .populate('applications', 'title description status')
        .lean();
};
exports.fetchAllUserJobsAdmin = fetchAllUserJobsAdmin;
const fetchAllJobsAdmin = async (status, page, limit, search) => {
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;
    let matchQuery = {};
    if (status === 'notStarted') {
        matchQuery.status = jobs_enum_1.JobStatusEnum.pending;
    }
    else if (status === 'inProgress') {
        matchQuery.status = jobs_enum_1.JobStatusEnum.active;
    }
    else if (status === 'completed') {
        matchQuery.status = jobs_enum_1.JobStatusEnum.complete;
    }
    const pipeline = [
        {
            $lookup: {
                from: 'Users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $unwind: {
                path: '$user',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                ...matchQuery,
                ...(search ? {
                    $or: [
                        { title: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } },
                        { jobId: { $regex: search, $options: 'i' } },
                        { 'user.userName': { $regex: search, $options: 'i' } },
                        { 'user.fullName': { $regex: search, $options: 'i' } }
                    ]
                } : {})
            }
        }
    ];
    const jobsPipeline = [
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: Number(skip) },
        { $limit: Number(limitNum) }
    ];
    const countPipeline = [
        ...pipeline,
        { $count: 'total' }
    ];
    const [jobs, countResult] = await Promise.all([
        jobs_model_1.default.aggregate(jobsPipeline),
        jobs_model_1.default.aggregate(countPipeline)
    ]);
    const totalJobs = countResult[0]?.total || 0;
    return {
        totalJobs,
        jobs,
        page: pageNum,
        totalPages: Math.ceil(totalJobs / limitNum)
    };
};
exports.fetchAllJobsAdmin = fetchAllJobsAdmin;
const fetchAllLikedJobs = async (userId) => {
    const likedJobs = await joblike_model_1.default.countDocuments({ user: userId });
    return {
        totalLikedJobs: likedJobs,
    };
};
exports.fetchAllLikedJobs = fetchAllLikedJobs;
const fetchJobLeads = async (userId, page, limit) => {
    const skip = (page - 1) * limit;
    const businesses = await business_model_1.default.find({ userId: userId }).exec();
    let offeredServices = [];
    businesses.forEach(business => {
        if (business.services && business.services.length) {
            offeredServices = offeredServices.concat(business.services);
        }
    });
    offeredServices = Array.from(new Set(offeredServices));
    const filter = {
        service: { $in: offeredServices },
        isClosed: false,
        userId: { $ne: userId }
    };
    const [jobs, total] = await Promise.all([
        jobs_model_1.default.find(filter).skip(skip).limit(limit).exec(),
        jobs_model_1.default.countDocuments(filter)
    ]);
    return {
        leadJobs: jobs,
        page,
        totalPages: Math.ceil(total / limit),
        totalLeads: total,
    };
};
exports.fetchJobLeads = fetchJobLeads;
const updateMilestone = async (jobId, milestoneId, updateData) => {
    return await jobs_model_1.default.updateOne({ _id: jobId, 'milestones._id': milestoneId }, {
        $set: {
            'milestones.$.paymentStatus': updateData.paymentStatus,
            'milestones.$.paymentInfo': updateData.paymentInfo,
        },
    });
};
exports.updateMilestone = updateMilestone;
const createRecurringJob = async (payload) => {
    return await recurring_job_model_1.default.create(payload);
};
exports.createRecurringJob = createRecurringJob;
const findRecurringJobsDue = async (today) => {
    const normalizedToday = (0, date_fns_1.startOfDay)(today);
    return await recurring_job_model_1.default.find({
        nextMaintenanceDate: { $lte: normalizedToday },
        endDate: { $gte: normalizedToday },
    });
};
exports.findRecurringJobsDue = findRecurringJobsDue;
const findRecurringJobsWithReminders = async (today) => {
    const formattedDate = (0, date_fns_1.format)(today, 'yyyy-MM-dd');
    return await recurring_job_model_1.default.find({
        'reminderDates.day': formattedDate,
    });
};
exports.findRecurringJobsWithReminders = findRecurringJobsWithReminders;
const activePendingJobs = async () => {
    return await jobs_model_1.default.find({
        status: { $in: ["active", "paused"] },
        isClosed: false,
    });
};
exports.activePendingJobs = activePendingJobs;
const fetchAllRecurringJobs = async (userId, limit, page) => {
    const jobs = await recurring_job_model_1.default.find()
        .populate({
        path: "jobId",
        match: { userId },
    })
        .limit(limit)
        .skip((page - 1) * limit)
        .then(results => results.filter(r => r.jobId));
    const totalJobs = await recurring_job_model_1.default.countDocuments()
        .populate({
        path: "jobId",
        match: { userId },
    });
    return {
        totalJobs,
        jobs
    };
};
exports.fetchAllRecurringJobs = fetchAllRecurringJobs;
const fetchJobsByUserId = async (userId) => {
    return await jobs_model_1.default.find({ userId: userId });
};
exports.fetchJobsByUserId = fetchJobsByUserId;
