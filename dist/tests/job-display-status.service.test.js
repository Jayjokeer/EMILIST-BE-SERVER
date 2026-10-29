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
(0, node_test_1.default)('an accepted job is active from the artisan perspective', () => {
    const artisanId = 'artisan-1';
    const job = {
        userId: 'owner-1',
        status: jobs_enum_1.JobStatusEnum.active,
        applications: [{ user: artisanId, status: project_enum_1.ProjectStatusEnum.accepted }],
    };
    strict_1.default.equal((0, job_service_1.resolveJobDisplayStatus)(job, artisanId), jobs_enum_1.JobStatusEnum.active);
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
