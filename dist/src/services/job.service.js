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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMilestone = exports.fetchJobLeads = exports.fetchAllLikedJobs = exports.fetchAllJobsAdmin = exports.fetchAllUserJobsAdmin = exports.fetchAllJobsForAdminDashboard = exports.projectAnalytics = exports.fetchProjectCounts = exports.fetchJobCount = exports.jobAnalytics = exports.fetchUserApplications = exports.fetchUserJobApplications = exports.fetchJobByUserIdAndStatus = exports.deleteJobById = exports.deleteJobApplication = exports.unlikeJob = exports.fetchLikedJobs = exports.createJobLike = exports.ifLikedJob = exports.fetchJobByIdWithDetails = exports.fetchJobById = exports.fetchAllJobs = exports.fetchAllUserJobs = exports.createJob = void 0;
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
const createJob = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield jobs_model_1.default.create(data);
});
exports.createJob = createJob;
const fetchAllUserJobs = (userId_1, page_1, limit_1, ...args_1) => __awaiter(void 0, [userId_1, page_1, limit_1, ...args_1], void 0, function* (userId, page, limit, search = null, filters = {}) {
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
    const jobs = yield jobs_model_1.default.find(searchCriteria).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const totalJobs = yield jobs_model_1.default.countDocuments(searchCriteria);
    return {
        jobs,
        totalPages: Math.ceil(totalJobs / limit),
        currentPage: page,
        totalJobs,
    };
});
exports.fetchAllUserJobs = fetchAllUserJobs;
const fetchAllJobs = (page_1, limit_1, userId_1, search_1, ...args_1) => __awaiter(void 0, [page_1, limit_1, userId_1, search_1, ...args_1], void 0, function* (page, limit, userId, search, filters = {}) {
    const skip = (page - 1) * limit;
    const searchCriteria = {
        type: { $ne: jobs_enum_1.JobType.direct },
        status: jobs_enum_1.JobStatusEnum.pending,
    };
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
    if (userId) {
        const user = yield userService.fetchUserMutedJobs(userId);
        if (user && user.mutedJobs && user.mutedJobs.length > 0) {
            searchCriteria._id = { $nin: user.mutedJobs };
        }
    }
    const jobs = yield jobs_model_1.default.find(searchCriteria)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    const totalJobs = yield jobs_model_1.default.countDocuments(searchCriteria);
    let jobsWithLikeStatus;
    if (userId) {
        const likedJobs = yield joblike_model_1.default.find({ user: userId }).select('job').lean();
        const likedJobIds = likedJobs.map((like) => like.job.toString());
        jobsWithLikeStatus = jobs.map((job) => (Object.assign(Object.assign({}, job.toObject()), { liked: likedJobIds.includes(job._id.toString()) })));
    }
    else {
        jobsWithLikeStatus = jobs.map((job) => (Object.assign(Object.assign({}, job.toObject()), { liked: false })));
    }
    return {
        jobs: jobsWithLikeStatus,
        totalPages: Math.ceil(totalJobs / limit),
        currentPage: page,
        totalJobs,
    };
});
exports.fetchAllJobs = fetchAllJobs;
const fetchJobById = (jobId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield jobs_model_1.default.findById(jobId);
});
exports.fetchJobById = fetchJobById;
const fetchJobByIdWithDetails = (jobId) => __awaiter(void 0, void 0, void 0, function* () {
    const job = yield jobs_model_1.default.findById(jobId)
        .populate('userId', 'fullName userName email location level profileImage')
        .populate({
        path: 'applications',
        populate: { path: 'user', select: 'fullName userName email location level profileImage' },
    });
    if (!job)
        throw new error_1.NotFoundError("Job not found!");
    const creatorId = job.userId;
    const totalJobsPosted = yield jobs_model_1.default.countDocuments({ userId: creatorId });
    const totalArtisansHired = yield project_model_1.default.countDocuments({
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
        milestones = job.milestones.map((milestone) => (Object.assign(Object.assign({}, milestone.toObject()), { dueDate: (0, date_fns_1.add)(job.startDate, { days: cumulativeDays }) })));
    }
    else {
        milestones = job.milestones;
    }
    return {
        job: Object.assign(Object.assign({}, job.toObject()), { dueDate: jobDueDate, milestones: milestones }),
        totalJobsPosted,
        totalArtisansHired,
    };
});
exports.fetchJobByIdWithDetails = fetchJobByIdWithDetails;
const ifLikedJob = (jobId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield joblike_model_1.default.findOne({ job: jobId, user: userId });
});
exports.ifLikedJob = ifLikedJob;
const createJobLike = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield joblike_model_1.default.create(data);
});
exports.createJobLike = createJobLike;
const fetchLikedJobs = (userId, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const likedJobs = yield joblike_model_1.default.find({ user: userId }).select('job').lean();
    const likedJobIds = likedJobs.map((like) => like.job);
    const jobs = yield jobs_model_1.default.find({ _id: { $in: likedJobIds } })
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
});
exports.fetchLikedJobs = fetchLikedJobs;
const unlikeJob = (jobId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield joblike_model_1.default.findOneAndDelete({ user: userId, job: jobId });
});
exports.unlikeJob = unlikeJob;
const deleteJobApplication = (jobId, projectId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield jobs_model_1.default.updateOne({ _id: jobId }, { $pull: { applications: projectId } });
});
exports.deleteJobApplication = deleteJobApplication;
const deleteJobById = (jobId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield jobs_model_1.default.findOneAndDelete({ userId: userId, _id: jobId });
});
exports.deleteJobById = deleteJobById;
const fetchJobByUserIdAndStatus = (userId, status) => __awaiter(void 0, void 0, void 0, function* () {
    return yield jobs_model_1.default.find({ userId: userId, status: status });
});
exports.fetchJobByUserIdAndStatus = fetchJobByUserIdAndStatus;
const fetchUserJobApplications = (userId_1, skip_1, limit_1, status_1, page_1, ...args_1) => __awaiter(void 0, [userId_1, skip_1, limit_1, status_1, page_1, ...args_1], void 0, function* (userId, skip, limit, status, page, search = null, filters = {}) {
    const userProjects = yield project_model_1.default.find({ user: userId }).select('_id');
    const projectIds = userProjects.map((project) => project._id);
    let query = { applications: { $in: projectIds } };
    if (status) {
        query.status = status;
        if (status === jobs_enum_1.JobStatusEnum.active) {
            query = { acceptedApplicationId: { $in: projectIds } };
            query.status = status;
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
    const userApplications = yield jobs_model_1.default.find(query)
        .populate('applications', 'title description status')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    const applicationsWithDueDates = yield Promise.all(userApplications.map((job) => __awaiter(void 0, void 0, void 0, function* () {
        if (job.status !== jobs_enum_1.JobStatusEnum.active && job.status !== jobs_enum_1.JobStatusEnum.paused) {
            return job.toObject();
        }
        let accumulatedTime = job.startDate.getTime();
        let milestoneDueDate = null;
        const totalMilestones = job.milestones.length;
        let completedMilestones = 0;
        job.milestones.forEach((milestone) => {
            const timeMultiplier = milestone.timeFrame.period === 'days' ? 86400000 : 604800000;
            const milestoneDuration = milestone.timeFrame.number * timeMultiplier;
            accumulatedTime += milestoneDuration;
            if (milestone.status === jobs_enum_1.MilestoneEnum.active || milestone.status === jobs_enum_1.MilestoneEnum.completed) {
                completedMilestones += 1;
            }
            if ((milestone.status === jobs_enum_1.MilestoneEnum.active || milestone.status === jobs_enum_1.MilestoneEnum.paused) && !milestoneDueDate) {
                milestoneDueDate = new Date(accumulatedTime);
            }
        });
        const milestoneProgress = `${completedMilestones}/${totalMilestones}`;
        const overallDueDate = new Date(accumulatedTime);
        return Object.assign(Object.assign({}, job.toObject()), { milestoneDueDate,
            overallDueDate,
            milestoneProgress });
    })));
    const totalApplications = yield jobs_model_1.default.countDocuments(query);
    return {
        total: totalApplications,
        page,
        limit,
        applications: applicationsWithDueDates,
    };
});
exports.fetchUserJobApplications = fetchUserJobApplications;
const fetchUserApplications = (userId, skip, limit, status, page) => __awaiter(void 0, void 0, void 0, function* () {
    const userProjects = yield project_model_1.default.find({ user: userId,
        status: status,
    }).select('_id');
    const projectIds = userProjects.map((project) => project._id);
    const userApplications = yield jobs_model_1.default.find({
        applications: { $in: projectIds },
    })
        .populate('applications', 'title description status')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });
    const totalApplications = yield jobs_model_1.default.countDocuments({
        applications: { $in: projectIds },
    });
    return {
        total: totalApplications,
        page: Number(page),
        limit: Number(limit),
        applications: userApplications,
    };
});
exports.fetchUserApplications = fetchUserApplications;
const jobAnalytics = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (year = (0, moment_1.default)().year(), month, startDate, endDate, userId) {
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
    const analyticsData = yield Promise.all(dateRange.map((date) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const dayStart = date.startOf(interval).toDate();
        const dayEnd = date.endOf(interval).toDate();
        const jobs = yield jobs_model_1.default.aggregate([
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
            totalJobs: ((_a = jobs[0]) === null || _a === void 0 ? void 0 : _a.totalJobs) || 0,
            totalActiveJobs: ((_b = jobs[0]) === null || _b === void 0 ? void 0 : _b.totalActiveJobs) || 0,
            totalOverdueJobs: ((_c = jobs[0]) === null || _c === void 0 ? void 0 : _c.totalOverdueJobs) || 0,
            totalPausedJobs: ((_d = jobs[0]) === null || _d === void 0 ? void 0 : _d.totalPausedJobs) || 0,
            totalCompletedJobs: ((_e = jobs[0]) === null || _e === void 0 ? void 0 : _e.totalCompletedJobs) || 0,
        };
    })));
    return analyticsData;
});
exports.jobAnalytics = jobAnalytics;
const fetchJobCount = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const totalPendingJobs = yield jobs_model_1.default.countDocuments({ userId, status: jobs_enum_1.JobStatusEnum.pending });
    const totalActiveJobs = yield jobs_model_1.default.countDocuments({ userId, status: jobs_enum_1.JobStatusEnum.active });
    const totalPausedJobs = yield jobs_model_1.default.countDocuments({ userId, status: jobs_enum_1.JobStatusEnum.paused });
    const totalCompletedJobs = yield jobs_model_1.default.countDocuments({ userId, status: jobs_enum_1.JobStatusEnum.complete });
    const totalOverdueJobs = yield jobs_model_1.default.countDocuments({
        userId,
        status: jobs_enum_1.JobStatusEnum.active,
        dueDate: { $lt: new Date() },
    });
    return {
        totalPendingJobs,
        totalActiveJobs,
        totalOverdueJobs,
        totalPausedJobs,
        totalCompletedJobs,
    };
});
exports.fetchJobCount = fetchJobCount;
const fetchProjectCounts = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const userProjects = yield project_model_1.default.find({ user: userId });
    let totalPendingProjects = 0;
    let totalOverdueProjects = 0;
    let totalDueProjects = 0;
    const currentDate = new Date();
    const userProjectIds = userProjects.map((project) => project._id);
    const totalActiveProjects = yield jobs_model_1.default.countDocuments({
        acceptedApplicationId: { $in: userProjectIds },
        status: jobs_enum_1.JobStatusEnum.active,
    });
    const totalPausedProjects = yield jobs_model_1.default.countDocuments({
        acceptedApplicationId: { $in: userProjectIds },
        status: jobs_enum_1.JobStatusEnum.paused,
    });
    const totalCompletedProjects = yield jobs_model_1.default.countDocuments({
        acceptedApplicationId: { $in: userProjectIds },
        status: jobs_enum_1.JobStatusEnum.complete,
    });
    userProjects.forEach((project) => {
        if (project.status == project_enum_1.ProjectStatusEnum.pending) {
            totalPendingProjects++;
        }
    });
    const jobs = yield jobs_model_1.default.find({
        acceptedApplicationId: { $in: userProjectIds },
        status: jobs_enum_1.JobStatusEnum.active,
    });
    jobs.forEach((job) => {
        let isProjectDue = false;
        job.milestones.forEach((milestone) => {
            var _a, _b, _c;
            if (milestone.status === jobs_enum_1.MilestoneEnum.overdue) {
                totalOverdueProjects++;
            }
            else if (milestone.status === jobs_enum_1.MilestoneEnum.active || milestone.status === jobs_enum_1.MilestoneEnum.pending) {
                const milestoneDueDate = new Date(((_b = (_a = job.startDate) === null || _a === void 0 ? void 0 : _a.getTime()) !== null && _b !== void 0 ? _b : currentDate.getTime()) +
                    ((_c = milestone.timeFrame.number) !== null && _c !== void 0 ? _c : 0) * 24 * 60 * 60 * 1000 // assuming timeFrame is in days
                );
                if (milestoneDueDate <= currentDate) {
                    isProjectDue = true;
                }
            }
        });
        if (isProjectDue) {
            totalDueProjects++;
        }
    });
    return {
        totalPendingProjects,
        totalActiveProjects,
        totalPausedProjects,
        totalCompletedProjects,
        totalOverdueProjects,
    };
});
exports.fetchProjectCounts = fetchProjectCounts;
const projectAnalytics = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (year = (0, moment_1.default)().year(), month, startDate, endDate, userId) {
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
    const projects = yield project_model_1.default.find({ user: userId }).select('_id');
    const projectIds = projects.map(project => project._id);
    const analyticsData = yield Promise.all(dateRange.map((date) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const dayStart = date.startOf(interval).toDate();
        const dayEnd = date.endOf(interval).toDate();
        const jobs = yield jobs_model_1.default.aggregate([
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
            totalProjects: ((_a = jobs[0]) === null || _a === void 0 ? void 0 : _a.totalProjects) || 0,
            totalActiveProjects: ((_b = jobs[0]) === null || _b === void 0 ? void 0 : _b.totalActiveProjects) || 0,
            totalOverdueProjects: ((_c = jobs[0]) === null || _c === void 0 ? void 0 : _c.totalOverdueProjects) || 0,
            totalPausedProjects: ((_d = jobs[0]) === null || _d === void 0 ? void 0 : _d.totalPausedProjects) || 0,
            totalCompletedProjects: ((_e = jobs[0]) === null || _e === void 0 ? void 0 : _e.totalCompletedProjects) || 0,
        };
    })));
    return analyticsData;
});
exports.projectAnalytics = projectAnalytics;
const fetchAllJobsForAdminDashboard = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield jobs_model_1.default.countDocuments();
});
exports.fetchAllJobsForAdminDashboard = fetchAllJobsForAdminDashboard;
const fetchAllUserJobsAdmin = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield jobs_model_1.default.find({ userId })
        .sort({ createdAt: -1 })
        .populate('applications', 'title description status')
        .lean();
});
exports.fetchAllUserJobsAdmin = fetchAllUserJobsAdmin;
const fetchAllJobsAdmin = (status, page, limit, search) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
            $match: Object.assign(Object.assign({}, matchQuery), (search ? {
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { jobId: { $regex: search, $options: 'i' } },
                    { 'user.userName': { $regex: search, $options: 'i' } },
                    { 'user.fullName': { $regex: search, $options: 'i' } }
                ]
            } : {}))
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
    const [jobs, countResult] = yield Promise.all([
        jobs_model_1.default.aggregate(jobsPipeline),
        jobs_model_1.default.aggregate(countPipeline)
    ]);
    const totalJobs = ((_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    return {
        totalJobs,
        jobs,
        page: pageNum,
        totalPages: Math.ceil(totalJobs / limitNum)
    };
});
exports.fetchAllJobsAdmin = fetchAllJobsAdmin;
const fetchAllLikedJobs = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const likedJobs = yield joblike_model_1.default.countDocuments({ user: userId });
    return {
        totalLikedJobs: likedJobs,
    };
});
exports.fetchAllLikedJobs = fetchAllLikedJobs;
const fetchJobLeads = (userId, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const businesses = yield business_model_1.default.find({ userId: userId }).exec();
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
    const [jobs, total] = yield Promise.all([
        jobs_model_1.default.find(filter).skip(skip).limit(limit).exec(),
        jobs_model_1.default.countDocuments(filter)
    ]);
    return {
        leadJobs: jobs,
        page,
        totalPages: Math.ceil(total / limit),
        totalLeads: total,
    };
});
exports.fetchJobLeads = fetchJobLeads;
const updateMilestone = (jobId, milestoneId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    yield jobs_model_1.default.updateOne({ _id: jobId, 'milestones._id': milestoneId }, {
        $set: {
            'milestones.$.paymentStatus': updateData.paymentStatus,
            'milestones.$.paymentInfo': updateData.paymentInfo,
        },
    });
});
exports.updateMilestone = updateMilestone;
