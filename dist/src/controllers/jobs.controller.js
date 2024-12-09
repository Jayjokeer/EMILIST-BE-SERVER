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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.muteJobController = exports.projectAnalyticsController = exports.fetchProjectCountsController = exports.fetchJobCountsController = exports.closeContractController = exports.jobAnalyticsController = exports.updateMilestonePaymentController = exports.acceptQuoteController = exports.postQuoteController = exports.requestForQuoteController = exports.updateMilestoneStatusController = exports.fetchApplicationByStatusController = exports.fetchUserAppliedJobsController = exports.acceptDirectJobController = exports.deleteFileController = exports.fetchJobByStatusController = exports.jobStatusController = exports.updateJobController = exports.deleteJobController = exports.deleteJobApplicationController = exports.applyForJobController = exports.unlikeJobController = exports.fetchLikedJobsController = exports.likeJobController = exports.fetchSingleJobController = exports.allJobsController = exports.allUserJobController = exports.createJobController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const jobService = __importStar(require("../services/job.service"));
const error_1 = require("../errors/error");
const projectService = __importStar(require("../services/project.service"));
const project_enum_1 = require("../enums/project.enum");
const jobs_enum_1 = require("../enums/jobs.enum");
const authService = __importStar(require("../services/auth.service"));
const send_email_1 = require("../utils/send_email");
const templates_1 = require("../utils/templates");
const mongoose_1 = __importDefault(require("mongoose"));
const businessService = __importStar(require("../services/business.service"));
const notificationService = __importStar(require("../services/notification.service"));
const notification_enum_1 = require("../enums/notification.enum");
const userService = __importStar(require("../services/auth.service"));
exports.createJobController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const job = req.body;
    const files = req.files;
    if (files && files.length > 0) {
        const fileObjects = files.map((file) => ({
            id: new mongoose_1.default.Types.ObjectId(),
            url: file.path,
        }));
        job.jobFiles = fileObjects;
    }
    if (job.type == jobs_enum_1.JobType.direct && (job.email || job.userName)) {
        const user = yield authService.findUserByEmailOrUserName(job.email, job.userName);
        if (!user)
            throw new error_1.NotFoundError("User not found!");
        const userId = req.user.id;
        job.userId = userId;
        const data = yield jobService.createJob(job);
        const payload = {
            job: data._id,
            user: user._id,
            creator: userId,
            directJobStatus: project_enum_1.ProjectStatusEnum.pending,
        };
        const project = yield projectService.createProject(payload);
        data.applications = [];
        data.applications.push(String(project._id));
        data.acceptedApplicationId = String(project._id);
        data.save();
        const { html, subject } = (0, templates_1.directJobApplicationMessage)(user.userName, req.user.userName, String(data._id));
        yield (0, send_email_1.sendEmail)(req.user.email, subject, html);
        (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    else {
        const user = req.user._id;
        job.userId = user;
        const data = yield jobService.createJob(job);
        (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
}));
exports.allUserJobController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, search = null, title, location, category, service } = req.query;
    const filters = {
        title,
        location,
        category,
        service
    };
    const data = yield jobService.fetchAllUserJobs(req.user.id, Number(page), Number(limit), search, filters);
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.allJobsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, title, location, category, service } = req.query;
    const userId = req.query.userId ? req.query.userId : null;
    const search = req.query.search || null;
    const filters = {
        title,
        location,
        category,
        service
    };
    const data = yield jobService.fetchAllJobs(Number(page), Number(limit), userId, search, filters);
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchSingleJobController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.query;
    if (!id) {
        throw new error_1.NotFoundError("Id required!");
    }
    ;
    const data = yield jobService.fetchJobByIdWithDetails(String(id));
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.likeJobController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { jobId } = req.params;
    const job = yield jobService.fetchJobById(String(jobId));
    if (!job) {
        throw new error_1.NotFoundError("Job not found!");
    }
    const existingLike = yield jobService.ifLikedJob(jobId, userId);
    if (existingLike) {
        throw new error_1.BadRequestError("Job previously liked!");
    }
    const data = yield jobService.createJobLike({ job: jobId, user: userId });
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.fetchLikedJobsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const data = yield jobService.fetchLikedJobs(userId, Number(page), Number(limit));
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.unlikeJobController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { jobId } = req.params;
    const data = yield jobService.unlikeJob(jobId, userId);
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.applyForJobController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { jobId, type, maximumPrice, milestones, businessId } = req.body;
    const job = yield jobService.fetchJobById(String(jobId));
    if (!job) {
        throw new error_1.NotFoundError("Job not found!");
    }
    if (userId === job.userId) {
        throw new error_1.BadRequestError("You cannot apply to your own job!");
    }
    if (job.status !== jobs_enum_1.JobStatusEnum.pending) {
        throw new error_1.BadRequestError("You can only apply to a pending job!");
    }
    const business = yield businessService.fetchSingleBusiness(String(businessId));
    if (!business) {
        throw new error_1.NotFoundError("Business not found!");
    }
    const payload = {
        job: jobId,
        user: userId,
        creator: job.userId,
        businessId: businessId,
    };
    if (type === jobs_enum_1.JobType.biddable) {
        if (!maximumPrice || !milestones) {
            throw new error_1.BadRequestError("Both maximumPrice and milestones are required for biddable jobs.");
        }
        payload.biddableDetails = {
            maximumPrice,
            milestones: milestones.map((milestone) => ({
                milestoneId: milestone.milestoneId,
                amount: milestone.amount,
                achievement: milestone.achievement,
            })),
        };
    }
    const projectData = yield projectService.createProject(payload);
    job.applications.push(String(projectData._id));
    job.milestones;
    yield job.save();
    const notificationPayload = {
        userId: job.userId,
        title: "Job Application",
        message: `${req.user.userName} applied to your job titled: ${job.title}`,
        type: notification_enum_1.NotificationTypeEnum.info
    };
    const user = yield userService.findUserById(job.userId);
    const { html, subject } = (0, templates_1.sendJobApplicationMessage)(user.userName, req.user.userName, job.title);
    (0, send_email_1.sendEmail)(user.email, subject, html);
    yield notificationService.createNotification(notificationPayload);
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, projectData);
}));
exports.deleteJobApplicationController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { projectId } = req.params;
    const project = yield projectService.fetchProjectById(projectId);
    if (!project) {
        throw new error_1.NotFoundError("Application not found!");
    }
    if (project.status !== project_enum_1.ProjectStatusEnum.pending) {
        throw new error_1.BadRequestError("You can only withdraw a pending application!");
    }
    yield jobService.deleteJobApplication(project.job, projectId);
    yield projectService.deleteProject(projectId, userId);
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Application withdrawn");
}));
exports.deleteJobController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { jobId } = req.params;
    const job = yield jobService.fetchJobById(jobId);
    if (!job)
        throw new error_1.NotFoundError("Job not found!");
    if (job.status !== jobs_enum_1.JobStatusEnum.pending) {
        throw new error_1.BadRequestError("You can only delete a pending job!");
    }
    yield jobService.deleteJobById(jobId, userId);
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Job deleted successfully");
}));
exports.updateJobController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { jobId } = req.params;
    const files = req.files;
    const updates = req.body;
    const job = yield jobService.fetchJobById(jobId);
    if (!job)
        throw new error_1.NotFoundError("Job not found!");
    if (job.status !== jobs_enum_1.JobStatusEnum.pending) {
        throw new error_1.BadRequestError("You can only edit a pending job!");
    }
    if (files && files.length > 0) {
        const fileObjects = files.map((file) => ({
            id: new mongoose_1.default.Types.ObjectId(),
            url: file.path,
        }));
        updates.jobFiles = [...(job.jobFiles || []), ...fileObjects];
    }
    Object.keys(updates).forEach((key) => {
        job[key] = updates[key];
    });
    yield job.save();
    const data = yield jobService.fetchJobById(jobId);
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.jobStatusController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { projectId } = req.params;
    const { status } = req.body;
    const project = yield projectService.fetchProjectById(projectId);
    const user = yield userService.findUserById(project.user);
    if (!project) {
        throw new error_1.NotFoundError("Application not found!");
    }
    if (project.creator != userId) {
        throw new error_1.UnauthorizedError("UnAuthorized!");
    }
    const job = yield jobService.fetchJobById(String(project.job));
    if (!job)
        throw new error_1.NotFoundError("Job not found!");
    if (status == project_enum_1.ProjectStatusEnum.pending) {
        job.status = jobs_enum_1.JobStatusEnum.pending;
        project.status = status;
    }
    else if (status == project_enum_1.ProjectStatusEnum.accepted) {
        job.status = jobs_enum_1.JobStatusEnum.active;
        job.acceptedApplicationId = projectId;
        project.acceptedAt = new Date();
        job.startDate = project.acceptedAt || new Date();
        job.milestones[0].status = jobs_enum_1.MilestoneEnum.active;
        project.status = status;
        if (job.type === jobs_enum_1.JobType.biddable && project.biddableDetails) {
            job.maximumPrice = project.biddableDetails.maximumPrice;
            project.biddableDetails.milestones.forEach((projectMilestone) => {
                const jobMilestone = job.milestones.find((m) => m._id.toString() === projectMilestone.milestoneId);
                if (jobMilestone) {
                    jobMilestone.amount = projectMilestone.amount;
                    jobMilestone.achievement = projectMilestone.achievement;
                }
            });
        }
        yield projectService.updateRejectProject(projectId, String(job._id));
        const applicationStatus = "accepted";
        const notificationPayload = {
            userId: project.user,
            title: `Job application ${applicationStatus}`,
            message: `${req.user.userName} ${applicationStatus} your job application titled: ${job.title}`,
            type: notification_enum_1.NotificationTypeEnum.info
        };
        const { html, subject } = (0, templates_1.acceptJobApplicationMessage)(user.userName, req.user.userName, job.title, applicationStatus);
        yield (0, send_email_1.sendEmail)(user.email, subject, html);
        yield notificationService.createNotification(notificationPayload);
    }
    else if (status == project_enum_1.ProjectStatusEnum.rejected) {
        project.rejectedAt = new Date();
        project.status = status;
        const applicationStatus = "rejected";
        const notificationPayload = {
            userId: project.user,
            title: `Job application ${applicationStatus}`,
            message: `${req.user.userName} ${applicationStatus} your job application titled: ${job.title}`,
            type: notification_enum_1.NotificationTypeEnum.info
        };
        const { html, subject } = (0, templates_1.acceptJobApplicationMessage)(user.userName, req.user.userName, job.title, applicationStatus);
        yield (0, send_email_1.sendEmail)(user.email, subject, html);
        yield notificationService.createNotification(notificationPayload);
    }
    else if (status == project_enum_1.ProjectStatusEnum.pause) {
        job.status = jobs_enum_1.JobStatusEnum.paused;
        job.pausedDate = new Date();
        job.milestones.forEach((milestone) => {
            if (milestone.status !== jobs_enum_1.MilestoneEnum.completed && milestone.status !== jobs_enum_1.MilestoneEnum.pending) {
                milestone.status = jobs_enum_1.MilestoneEnum.paused;
            }
        });
        const applicationStatus = "paused";
        const notificationPayload = {
            userId: project.user,
            title: `Job ${applicationStatus}`,
            message: `${req.user.userName} ${applicationStatus} your job application titled: ${job.title}`,
            type: notification_enum_1.NotificationTypeEnum.info
        };
        const { html, subject } = (0, templates_1.acceptJobApplicationMessage)(user.userName, req.user.userName, job.title, applicationStatus);
        yield (0, send_email_1.sendEmail)(user.email, subject, html);
        yield notificationService.createNotification(notificationPayload);
    }
    else if (status == project_enum_1.ProjectStatusEnum.unpause) {
        job.status = jobs_enum_1.JobStatusEnum.active;
        job.milestones.forEach((milestone) => {
            if (milestone.status === jobs_enum_1.MilestoneEnum.paused) {
                milestone.status = jobs_enum_1.MilestoneEnum.active;
            }
        });
        const applicationStatus = "unpaused";
        const notificationPayload = {
            userId: project.user,
            title: `Job application ${applicationStatus}`,
            message: `${req.user.userName} ${applicationStatus} your job application titled: ${job.title}`,
            type: notification_enum_1.NotificationTypeEnum.info
        };
        const { html, subject } = (0, templates_1.acceptJobApplicationMessage)(user.userName, req.user.userName, job.title, applicationStatus);
        yield (0, send_email_1.sendEmail)(user.email, subject, html);
        yield notificationService.createNotification(notificationPayload);
    }
    yield project.save();
    yield job.save();
    const data = yield jobService.fetchJobById(String(job._id));
    (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchJobByStatusController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { status } = req.query;
    let data;
    if (status === jobs_enum_1.JobStatusEnum.pending || status === jobs_enum_1.JobStatusEnum.complete) {
        const jobs = yield jobService.fetchJobByUserIdAndStatus(userId, status);
        data = jobs;
    }
    else if (status === jobs_enum_1.JobStatusEnum.active || status === jobs_enum_1.JobStatusEnum.paused) {
        const jobs = yield jobService.fetchJobByUserIdAndStatus(userId, status);
        data = jobs.map((job) => {
            const totalMilestones = job.milestones.length;
            let milestoneStartDate = new Date(job.startDate || new Date());
            let currentMilestoneDueDate = new Date(milestoneStartDate);
            let overallDueDate = new Date(milestoneStartDate);
            let milestoneProgress = "0/0";
            for (let i = 0; i < totalMilestones; i++) {
                const milestone = job.milestones[i];
                const duration = parseInt(milestone.timeFrame.number, 10) || 0;
                const durationMs = milestone.timeFrame.period === 'days'
                    ? duration * 86400000
                    : milestone.timeFrame.period === 'weeks'
                        ? duration * 604800000
                        : duration * 2629800000;
                overallDueDate = new Date(overallDueDate.getTime() + durationMs);
                if (milestone.status === jobs_enum_1.MilestoneEnum.active || milestone.status === jobs_enum_1.MilestoneEnum.paused) {
                    milestoneProgress = `${i + 1}/${totalMilestones}`;
                    currentMilestoneDueDate = new Date(overallDueDate);
                    break;
                }
                milestoneStartDate = new Date(overallDueDate);
            }
            return Object.assign(Object.assign({}, job.toObject()), { milestoneProgress,
                currentMilestoneDueDate,
                overallDueDate });
        });
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.deleteFileController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId, fileId } = req.params;
    const job = yield jobService.fetchJobById(jobId);
    if (!job) {
        throw new error_1.NotFoundError('Job not found');
    }
    job.jobFiles = job.jobFiles.filter((file) => file.id.toString() !== fileId);
    yield job.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Image deleted successfully");
}));
exports.acceptDirectJobController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { status, businessId } = req.body;
    const user = req.user;
    const project = yield projectService.fetchProjectById(projectId);
    if (!project) {
        throw new error_1.NotFoundError("Application not found!");
    }
    if (String(project.user) !== String(user.id)) {
        throw new error_1.BadRequestError("Unauthorized!");
    }
    const job = yield jobService.fetchJobById(String(project.job));
    if (!job) {
        throw new error_1.NotFoundError("Job not found!");
    }
    if (status == project_enum_1.ProjectStatusEnum.accepted) {
        job.status = jobs_enum_1.JobStatusEnum.active;
        job.milestones[0].status = jobs_enum_1.MilestoneEnum.active;
        project.status = project_enum_1.ProjectStatusEnum.accepted;
        project.businessId = businessId;
        project.directJobStatus = project_enum_1.ProjectStatusEnum.accepted;
    }
    else if (status == project_enum_1.ProjectStatusEnum.rejected) {
        project.status = project_enum_1.ProjectStatusEnum.rejected;
        project.directJobStatus = project_enum_1.ProjectStatusEnum.rejected;
        job.acceptedApplicationId = undefined;
        job.status = jobs_enum_1.JobStatusEnum.pending;
        job.type = jobs_enum_1.JobType.regular;
    }
    ;
    yield project.save();
    yield job.save();
    const jobOwner = yield userService.findUserById(job.userId);
    const applicationStatus = status;
    const notificationPayload = {
        userId: job.userId,
        title: `Direct job ${applicationStatus}`,
        message: `${req.user.userName} ${applicationStatus} your direct job  with ID: ${job._id}`,
        type: notification_enum_1.NotificationTypeEnum.info
    };
    const { html, subject } = (0, templates_1.acceptDirectJobApplicationMessage)(user.userName, jobOwner.userName, String(job._id));
    yield (0, send_email_1.sendEmail)(jobOwner.email, subject, html);
    yield notificationService.createNotification(notificationPayload);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Status changed successfully");
}));
exports.fetchUserAppliedJobsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { status, search = null, title, location, category, service } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const statusEnum = status ? status : null;
    const filters = {
        title,
        location,
        category,
        service
    };
    const data = yield jobService.fetchUserJobApplications(user.id, skip, limit, statusEnum, page, search, filters);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchApplicationByStatusController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { status } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const data = yield jobService.fetchUserApplications(user.id, skip, limit, status, page);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.updateMilestoneStatusController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { milestoneId, jobId } = req.params;
    const { status, bank, accountNumber, accountName, paymentMethod, note } = req.body;
    const job = yield jobService.fetchJobById(String(jobId));
    if (!job) {
        throw new error_1.NotFoundError("Job not found!");
    }
    if (job.status == jobs_enum_1.JobStatusEnum.pending) {
        throw new error_1.BadRequestError("You cannot update a pending job milestone");
    }
    const project = yield projectService.fetchProjectById(String(job.acceptedApplicationId));
    if (!project) {
        throw new error_1.NotFoundError("Application not found!");
    }
    if (String(project.user) !== String(user.id)) {
        throw new error_1.UnauthorizedError("Unauthorized!");
    }
    const milestoneIndex = job.milestones.findIndex((milestone) => String(milestone._id) === String(milestoneId));
    if (milestoneIndex === -1) {
        throw new error_1.NotFoundError("Milestone not found");
    }
    const milestone = job.milestones[milestoneIndex];
    milestone.status = status;
    if (status === jobs_enum_1.MilestoneEnum.completed) {
        const nextMilestone = job.milestones[milestoneIndex + 1];
        if (nextMilestone && nextMilestone.status === jobs_enum_1.MilestoneEnum.pending) {
            nextMilestone.status = jobs_enum_1.MilestoneEnum.active;
        }
        milestone.accountDetails = {
            bank,
            accountNumber,
            accountName,
            paymentMethod,
            note
        };
        const allMilestonesCompleted = job.milestones.every((m) => m.status === jobs_enum_1.MilestoneEnum.completed);
        if (allMilestonesCompleted) {
            job.status = jobs_enum_1.JobStatusEnum.complete;
            project.status = project_enum_1.ProjectStatusEnum.completed;
            yield project.save();
        }
    }
    if (!milestone)
        throw new error_1.NotFoundError("Milestone not found");
    milestone.status = status;
    yield job.save();
    const data = yield jobService.fetchJobById(String(jobId));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.requestForQuoteController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId } = req.params;
    const loggedInUser = req.user;
    const job = yield jobService.fetchJobById(String(jobId));
    if (!job) {
        throw new error_1.NotFoundError("Job not found!");
    }
    if (String(loggedInUser.id) !== String(job.userId)) {
        throw new error_1.UnauthorizedError("Unauthorized");
    }
    if (job.status !== jobs_enum_1.JobStatusEnum.active && job.status !== jobs_enum_1.JobStatusEnum.paused) {
        throw new error_1.BadRequestError("You can only request for quote on an active or paused job!");
    }
    job.isRequestForQuote = true;
    const project = yield projectService.fetchProjectById(String(job.acceptedApplicationId));
    const user = yield authService.findUserById(String(project === null || project === void 0 ? void 0 : project.user));
    if (!user)
        throw new error_1.NotFoundError("user not found!");
    job.save();
    const { html, subject } = (0, templates_1.requestForQuoteMessage)(user.userName, req.user.userName, String(job._id));
    yield (0, send_email_1.sendEmail)(user.email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, 'Request for quote sent successfully');
}));
exports.postQuoteController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const loggedInUser = req.user;
    const { milestones, jobId, totalAmount } = req.body;
    const job = yield jobService.fetchJobById(String(jobId));
    if (!job) {
        throw new error_1.NotFoundError("Job not found!");
    }
    if (String(loggedInUser.id) === String(job.userId)) {
        throw new error_1.UnauthorizedError("You cannot post a quote on your own job!");
    }
    if (job.status !== jobs_enum_1.JobStatusEnum.active && job.status !== jobs_enum_1.JobStatusEnum.paused) {
        throw new error_1.BadRequestError("You can only post quote on an active or paused job!");
    }
    if (!job.isRequestForQuote) {
        throw new error_1.BadRequestError("You cannot post a quote on this job");
    }
    const project = yield projectService.fetchProjectById(String(job.acceptedApplicationId));
    if (!project) {
        throw new error_1.NotFoundError("Project not found!");
    }
    project.quote = {
        milestones: milestones.map((milestone) => ({
            milestoneId: milestone.milestoneId,
            amount: milestone.amount,
            achievement: milestone.achievement,
        })),
        totalAmount: totalAmount,
        postedAt: new Date()
    };
    yield project.save();
    const user = yield authService.findUserById(String(job.userId));
    if (!user)
        throw new error_1.NotFoundError("user not found!");
    yield job.save();
    const { html, subject } = (0, templates_1.postQuoteMessage)(user.userName, req.user.userName, String(job._id));
    yield (0, send_email_1.sendEmail)(user.email, subject, html);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, 'Quote sent successfully');
}));
exports.acceptQuoteController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const { projectId } = req.params;
    const { status } = req.body;
    const project = yield projectService.fetchProjectById(projectId);
    if (!project) {
        throw new error_1.NotFoundError("Application not found!");
    }
    if (project.creator != userId) {
        throw new error_1.UnauthorizedError("UnAuthorized!");
    }
    const job = yield jobService.fetchJobById(String(project.job));
    if (!job)
        throw new error_1.NotFoundError("Job not found!");
    project.quote.status = status;
    if (status == jobs_enum_1.QuoteStatusEnum.accepted) {
        job.status = jobs_enum_1.JobStatusEnum.active;
        project.quote.acceptedAt = new Date();
        if (job.type === jobs_enum_1.JobType.biddable) {
            job.maximumPrice = project.quote.totalAmount;
        }
        else {
            job.budget = project.quote.totalAmount;
        }
        ;
        project.quote.milestones.forEach((projectMilestone) => {
            const jobMilestone = job.milestones.find((m) => m._id.toString() === projectMilestone.milestoneId);
            if (jobMilestone) {
                jobMilestone.amount = projectMilestone.amount;
                jobMilestone.achievement = projectMilestone.achievement;
            }
        });
    }
    else if (status == jobs_enum_1.QuoteStatusEnum.rejected) {
        project.quote.rejectedAt = new Date();
    }
    yield project.save();
    yield job.save();
    const data = yield jobService.fetchJobById(String(job._id));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.updateMilestonePaymentController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { amountPaid, paymentMethod, date, jobId, milestoneId, note } = req.body;
    if (!jobId && !milestoneId) {
        throw new error_1.NotFoundError("Ids required!");
    }
    ;
    const job = yield jobService.fetchJobById(String(jobId));
    if (!job)
        throw new error_1.NotFoundError("Job not found!");
    if (String(job.userId) !== String(req.user.id))
        throw new error_1.BadRequestError("Unauthorized!");
    const milestone = job.milestones.find((milestone) => String(milestone._id) === milestoneId);
    if (!milestone) {
        throw new error_1.NotFoundError("Milestone not found within this job!");
    }
    milestone.paymentInfo = {
        amountPaid,
        paymentMethod,
        date,
        note,
    };
    if (req.file) {
        milestone.paymentInfo.paymentReciept = req.file.path;
    }
    milestone.paymentStatus = jobs_enum_1.MilestonePaymentStatus.paid;
    yield job.save();
    const data = yield jobService.fetchJobById(String(jobId));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.jobAnalyticsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, year, month } = req.query;
    const userId = req.user._id;
    const data = yield jobService.jobAnalytics(year, month, startDate, endDate, userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.closeContractController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { jobId } = req.params;
    const { rating, note, rateCommunication, isRecommendVendor } = req.body;
    const job = yield jobService.fetchJobById(String(jobId));
    if (!job)
        throw new error_1.NotFoundError('Job not found!');
    if (String(userId) !== String(job.userId)) {
        throw new error_1.UnauthorizedError("Unauthorized!");
    }
    if (job.isClosed)
        throw new error_1.BadRequestError('Contract is already closed!');
    const allMilestonesCompletedAndPaid = job.milestones.every((milestone) => milestone.status === jobs_enum_1.MilestoneEnum.completed && milestone.paymentStatus === jobs_enum_1.MilestonePaymentStatus.paid);
    if (!allMilestonesCompletedAndPaid) {
        throw new error_1.BadRequestError('All milestones must be completed and paid before closing the contract.');
    }
    if (job.status !== jobs_enum_1.JobStatusEnum.complete) {
        job.status = jobs_enum_1.JobStatusEnum.complete;
    }
    const project = yield projectService.fetchProjectById(String(job.acceptedApplicationId));
    if (!project) {
        throw new error_1.NotFoundError("Project not foound!");
    }
    project.status = project_enum_1.ProjectStatusEnum.completed;
    job.isClosed = true;
    job.review.rating = rating;
    job.review.note = note;
    job.review.rateCommunication = rateCommunication;
    job.review.isRecommendVendor = isRecommendVendor;
    yield job.save();
    yield project.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Job closed successfully");
}));
exports.fetchJobCountsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const data = yield jobService.fetchJobCount(String(userId));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.fetchProjectCountsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const data = yield jobService.fetchProjectCounts(String(userId));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.projectAnalyticsController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, year, month } = req.query;
    const userId = req.user._id;
    const data = yield jobService.projectAnalytics(year, month, startDate, endDate, userId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.muteJobController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId } = req.params;
    const userId = req.user._id;
    const job = yield jobService.fetchJobById(jobId);
    if (!job) {
        throw new error_1.NotFoundError("Job not found!");
    }
    if (String(userId) === String(job.userId)) {
        throw new error_1.BadRequestError("You cannot mute your own job!");
    }
    const user = yield userService.findUserById(userId);
    const isMuted = user === null || user === void 0 ? void 0 : user.mutedJobs.includes(jobId);
    if (isMuted) {
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Job is already muted.");
    }
    user.mutedJobs.push(jobId);
    yield (user === null || user === void 0 ? void 0 : user.save());
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, "Job muted successfully");
}));
// export const checkOverdueMilestones = async () => {
//   const job = await jobs.find({ 'milestones.status': MilestoneEnum.pending });
//   const now = new Date();
//   job.forEach(async (job: IJob) => {
//     let milestonesUpdated = false;
//     job.milestones.forEach((milestone: IMilestone) => {
//       if (milestone.status === MilestoneEnum.pending && milestone.timeFrame && job.startDate) {
//         const dueDate = new Date(job.startDate);
//         dueDate.setDate(dueDate.getDate() + Number(milestone.timeFrame.number));
//         if (dueDate < now) {
//           milestone.status = MilestoneEnum.overdue;
//           milestonesUpdated = true;
//         }
//       }
//     });
//     if (milestonesUpdated) {
//       await job.save();
//     }
//   });
// };
