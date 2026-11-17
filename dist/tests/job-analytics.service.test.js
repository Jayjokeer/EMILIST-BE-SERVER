"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const mongoose_1 = require("mongoose");
const jobs_model_1 = __importDefault(require("../src/models/jobs.model"));
const project_model_1 = __importDefault(require("../src/models/project.model"));
const jobs_enum_1 = require("../src/enums/jobs.enum");
const project_enum_1 = require("../src/enums/project.enum");
const job_service_1 = require("../src/services/job.service");
(0, node_test_1.default)('job analytics returns one object with totals and the period breakdown', () => {
    const periods = [
        {
            period: 'Jan 2026',
            totalJobs: 3,
            totalActiveJobs: 1,
            totalOverdueJobs: 0,
            totalPausedJobs: 0,
            totalCompletedJobs: 1,
            totalPendingJobs: 1,
        },
        {
            period: 'Feb 2026',
            totalJobs: 4,
            totalActiveJobs: 2,
            totalOverdueJobs: 1,
            totalPausedJobs: 0,
            totalCompletedJobs: 1,
            totalPendingJobs: 0,
        },
    ];
    strict_1.default.deepEqual((0, job_service_1.formatJobAnalyticsResponse)(periods), {
        totalJobs: 7,
        totalActiveJobs: 3,
        totalOverdueJobs: 1,
        totalPausedJobs: 0,
        totalCompletedJobs: 2,
        totalPendingJobs: 1,
        totalDraftJobs: 0,
        totalListedJobs: 0,
        totalInReviewJobs: 0,
        totalCancelledJobs: 0,
        periods,
    });
});
(0, node_test_1.default)('job analytics returns an empty object summary when there are no periods', () => {
    strict_1.default.deepEqual((0, job_service_1.formatJobAnalyticsResponse)([]), {
        totalJobs: 0,
        totalActiveJobs: 0,
        totalOverdueJobs: 0,
        totalPausedJobs: 0,
        totalCompletedJobs: 0,
        totalPendingJobs: 0,
        totalDraftJobs: 0,
        totalListedJobs: 0,
        totalInReviewJobs: 0,
        totalCancelledJobs: 0,
        periods: [],
    });
});
(0, node_test_1.default)('accepted artisan assignments are counted as active jobs', async () => {
    const originalProjectFind = project_model_1.default.find;
    const originalJobsFind = jobs_model_1.default.find;
    const artisanId = new mongoose_1.Types.ObjectId();
    const ownerId = new mongoose_1.Types.ObjectId();
    const projectOne = new mongoose_1.Types.ObjectId();
    const projectTwo = new mongoose_1.Types.ObjectId();
    const acceptedAt = new Date('2026-04-10T10:00:00.000Z');
    project_model_1.default.find = () => ({
        select: () => ({
            lean: async () => [
                { _id: projectOne, status: project_enum_1.ProjectStatusEnum.accepted, acceptedAt, updatedAt: acceptedAt },
                { _id: projectTwo, status: project_enum_1.ProjectStatusEnum.accepted, acceptedAt, updatedAt: acceptedAt },
            ],
        }),
    });
    jobs_model_1.default.find = () => ({
        lean: async () => [
            { _id: new mongoose_1.Types.ObjectId(), userId: ownerId, status: jobs_enum_1.JobStatusEnum.active, acceptedApplicationId: projectOne, acceptedAt, milestones: [] },
            { _id: new mongoose_1.Types.ObjectId(), userId: ownerId, status: jobs_enum_1.JobStatusEnum.active, acceptedApplicationId: projectTwo, acceptedAt, milestones: [] },
        ],
    });
    try {
        const result = await (0, job_service_1.jobAnalytics)(2026, undefined, undefined, undefined, artisanId.toString());
        strict_1.default.equal(result.totalJobs, 2);
        strict_1.default.equal(result.totalActiveJobs, 2);
        strict_1.default.equal(result.scope.assignedJobs, 2);
        strict_1.default.equal(result.scope.ownedJobs, 0);
    }
    finally {
        project_model_1.default.find = originalProjectFind;
        jobs_model_1.default.find = originalJobsFind;
    }
});
(0, node_test_1.default)('all job views use the same duration-aware overdue calculation', () => {
    const dueDate = (0, job_service_1.calculateJobDueDate)({
        acceptedAt: new Date('2026-01-01T00:00:00.000Z'),
        milestones: [
            { timeFrame: { number: '1', period: 'weeks' } },
            { timeFrame: { number: '2', period: 'days' } },
        ],
    });
    strict_1.default.equal(dueDate?.toISOString(), '2026-01-10T00:00:00.000Z');
    const summary = (0, job_service_1.summarizeJobAnalyticsPeriod)([
        {
            relationship: 'assigned',
            relationshipDate: new Date('2026-01-01T00:00:00.000Z'),
            job: {
                status: jobs_enum_1.JobStatusEnum.active,
                acceptedAt: new Date('2026-01-01T00:00:00.000Z'),
                milestones: [{ timeFrame: { number: '1', period: 'days' } }],
            },
        },
    ], 'Jan 2026', new Date('2026-01-03T00:00:00.000Z'));
    strict_1.default.equal(summary.totalOverdueJobs, 1);
    strict_1.default.equal(summary.totalActiveJobs, 0);
});
(0, node_test_1.default)('all acceptance paths apply the same assignment invariants', () => {
    const applicationId = new mongoose_1.Types.ObjectId();
    const acceptedAt = new Date('2026-04-10T10:00:00.000Z');
    const job = {
        status: jobs_enum_1.JobStatusEnum.listed,
        milestones: [{ status: jobs_enum_1.MilestoneEnum.pending }, { status: jobs_enum_1.MilestoneEnum.pending }],
    };
    const project = { _id: applicationId, status: project_enum_1.ProjectStatusEnum.applied };
    (0, job_service_1.activateAcceptedApplication)(job, project, acceptedAt);
    strict_1.default.equal(job.status, jobs_enum_1.JobStatusEnum.active);
    strict_1.default.equal(String(job.acceptedApplicationId), String(applicationId));
    strict_1.default.equal(job.acceptedAt, acceptedAt);
    strict_1.default.equal(project.status, project_enum_1.ProjectStatusEnum.accepted);
    strict_1.default.equal(project.acceptedAt, acceptedAt);
    strict_1.default.equal(job.milestones[0].status, jobs_enum_1.MilestoneEnum.active);
    strict_1.default.equal(job.milestones[1].status, jobs_enum_1.MilestoneEnum.pending);
});
