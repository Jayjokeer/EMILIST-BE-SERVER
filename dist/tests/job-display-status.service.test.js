"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const jobs_enum_1 = require("../src/enums/jobs.enum");
const project_enum_1 = require("../src/enums/project.enum");
const job_service_1 = require("../src/services/job.service");
(0, node_test_1.default)('invoice issue date is recorded once and preserved', () => {
    const firstIssueDate = new Date('2026-10-29T10:00:00.000Z');
    const firstInvoiceId = 'invoice-1';
    const invoice = { invoiceRaised: false };
    (0, job_service_1.raiseMilestoneInvoice)(invoice, firstIssueDate, firstInvoiceId);
    (0, job_service_1.raiseMilestoneInvoice)(invoice, new Date('2026-10-30T10:00:00.000Z'), 'invoice-2');
    strict_1.default.equal(invoice.invoiceRaised, true);
    strict_1.default.equal(invoice.invoiceId, firstInvoiceId);
    strict_1.default.equal(invoice.issuedAt, firstIssueDate);
});
(0, node_test_1.default)('legacy invoices expose a null issue date in job details', () => {
    strict_1.default.deepEqual((0, job_service_1.serializeMilestoneWithInvoiceDate)({
        status: jobs_enum_1.MilestoneEnum.completed,
        invoice: { invoiceRaised: true },
    }).invoice, {
        invoiceRaised: true,
        invoiceId: null,
        issuedAt: null,
    });
});
(0, node_test_1.default)('owner rejection reactivates completed work and records the reason', () => {
    const rejectedAt = new Date('2026-10-30T09:00:00.000Z');
    const milestone = {
        status: jobs_enum_1.MilestoneEnum.completed,
        paymentStatus: jobs_enum_1.MilestonePaymentStatus.unpaid,
        invoice: { invoiceRaised: true, reviewStatus: 'pending' },
    };
    (0, job_service_1.rejectCompletedMilestone)(milestone, 'Please correct the leaking joint.', rejectedAt);
    strict_1.default.equal(milestone.status, jobs_enum_1.MilestoneEnum.active);
    strict_1.default.equal(milestone.invoice.reviewStatus, 'rejected');
    strict_1.default.equal(milestone.invoice.rejectionReason, 'Please correct the leaking joint.');
    strict_1.default.equal(milestone.invoice.rejectedAt, rejectedAt);
});
(0, node_test_1.default)('completed milestone work does not complete the job before payment', () => {
    strict_1.default.equal((0, job_service_1.areAllMilestonesCompletedAndPaid)([{
            status: jobs_enum_1.MilestoneEnum.completed,
            paymentStatus: jobs_enum_1.MilestonePaymentStatus.unpaid,
        }]), false);
});
(0, node_test_1.default)('the job can complete after every completed milestone is paid', () => {
    strict_1.default.equal((0, job_service_1.areAllMilestonesCompletedAndPaid)([
        { status: jobs_enum_1.MilestoneEnum.completed, paymentStatus: jobs_enum_1.MilestonePaymentStatus.paid },
        { status: jobs_enum_1.MilestoneEnum.completed, paymentStatus: jobs_enum_1.MilestonePaymentStatus.paid },
    ]), true);
});
(0, node_test_1.default)('status endpoint includes jobs owned by or assigned to the artisan', () => {
    strict_1.default.deepEqual((0, job_service_1.buildVisibleJobsQuery)('artisan-1', ['application-1']), {
        $or: [
            { userId: 'artisan-1' },
            { acceptedApplicationId: { $in: ['application-1'] } },
        ],
    });
});
(0, node_test_1.default)('an accepted job is active from the artisan perspective', () => {
    const artisanId = 'artisan-1';
    const job = {
        userId: 'owner-1',
        status: jobs_enum_1.JobStatusEnum.active,
        applications: [{ user: artisanId, status: project_enum_1.ProjectStatusEnum.accepted }],
    };
    strict_1.default.equal((0, job_service_1.resolveJobDisplayStatus)(job, artisanId), jobs_enum_1.JobStatusEnum.active);
});
(0, node_test_1.default)('an accepted application follows the job lifecycle after activation', () => {
    const artisanId = 'artisan-1';
    const application = {
        _id: 'application-1',
        user: artisanId,
        status: project_enum_1.ProjectStatusEnum.accepted,
    };
    strict_1.default.equal((0, job_service_1.resolveJobDisplayStatus)({
        userId: 'owner-1',
        acceptedApplicationId: application._id,
        status: jobs_enum_1.JobStatusEnum.paused,
        applications: [application],
    }, artisanId), jobs_enum_1.JobStatusEnum.paused);
    strict_1.default.equal((0, job_service_1.resolveJobDisplayStatus)({
        userId: 'owner-1',
        acceptedApplicationId: application._id,
        status: jobs_enum_1.JobStatusEnum.complete,
        applications: [application],
    }, artisanId), jobs_enum_1.JobStatusEnum.complete);
});
(0, node_test_1.default)('application-only states remain visible to the artisan', () => {
    const artisanId = 'artisan-1';
    const job = {
        userId: 'owner-1',
        status: jobs_enum_1.JobStatusEnum.listed,
        applications: [{ user: artisanId, status: project_enum_1.ProjectStatusEnum.rejected }],
    };
    strict_1.default.equal((0, job_service_1.resolveJobDisplayStatus)(job, artisanId), project_enum_1.ProjectStatusEnum.rejected);
});
