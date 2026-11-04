"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const jobs_enum_1 = require("../src/enums/jobs.enum");
const admin_job_service_1 = require("../src/services/admin-job.service");
(0, node_test_1.default)("admin job pagination applies safe defaults and limits", () => {
    strict_1.default.deepEqual((0, admin_job_service_1.adminJobPagination)(undefined, undefined), { page: 1, limit: 10, skip: 0 });
    strict_1.default.deepEqual((0, admin_job_service_1.adminJobPagination)("3", "25"), { page: 3, limit: 25, skip: 50 });
    strict_1.default.deepEqual((0, admin_job_service_1.adminJobPagination)("-1", "999"), { page: 1, limit: 100, skip: 0 });
});
(0, node_test_1.default)("an unlisted legacy listed job is presented as a draft", () => {
    strict_1.default.equal((0, admin_job_service_1.jobDisplayStatus)({ status: jobs_enum_1.JobStatusEnum.listed, isListed: false }), jobs_enum_1.JobStatusEnum.draft);
    strict_1.default.equal((0, admin_job_service_1.jobDisplayStatus)({ status: jobs_enum_1.JobStatusEnum.active, isListed: true }), jobs_enum_1.JobStatusEnum.active);
});
(0, node_test_1.default)("job actions follow the state-management design", () => {
    strict_1.default.deepEqual((0, admin_job_service_1.adminJobActionsForStatus)(jobs_enum_1.JobStatusEnum.draft), ["remove_listing"]);
    strict_1.default.deepEqual((0, admin_job_service_1.adminJobActionsForStatus)(jobs_enum_1.JobStatusEnum.listed), ["approve_listing", "reject_listing"]);
    strict_1.default.deepEqual((0, admin_job_service_1.adminJobActionsForStatus)(jobs_enum_1.JobStatusEnum.in_review), ["remove_listing"]);
    strict_1.default.deepEqual((0, admin_job_service_1.adminJobActionsForStatus)(jobs_enum_1.JobStatusEnum.active), ["pause"]);
    strict_1.default.deepEqual((0, admin_job_service_1.adminJobActionsForStatus)(jobs_enum_1.JobStatusEnum.paused), ["resume"]);
    strict_1.default.deepEqual((0, admin_job_service_1.adminJobActionsForStatus)(jobs_enum_1.JobStatusEnum.overdue), ["cancel"]);
    strict_1.default.deepEqual((0, admin_job_service_1.adminJobActionsForStatus)(jobs_enum_1.JobStatusEnum.complete), ["convert_to_recurring"]);
});
