"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const jobs_enum_1 = require("../src/enums/jobs.enum");
const dashboard_service_1 = require("../src/services/dashboard.service");
(0, node_test_1.default)("dashboard week range starts on Monday and ends at the supplied time", () => {
    const now = new Date("2026-11-21T09:42:15.000Z");
    const range = (0, dashboard_service_1.dashboardPeriodRange)("week", now);
    strict_1.default.equal(range.startDate?.getFullYear(), 2026);
    strict_1.default.equal(range.startDate?.getMonth(), 10);
    strict_1.default.equal(range.startDate?.getDate(), 16);
    strict_1.default.equal(range.startDate?.getHours(), 0);
    strict_1.default.equal(range.endDate.toISOString(), now.toISOString());
    strict_1.default.equal(range.label, "This week");
});
(0, node_test_1.default)("job completion chart uses mutually exclusive buckets that total 100 percent", () => {
    const result = (0, dashboard_service_1.summarizeJobCompletion)([
        jobs_enum_1.JobStatusEnum.complete,
        jobs_enum_1.JobStatusEnum.active,
        jobs_enum_1.JobStatusEnum.pending,
        jobs_enum_1.JobStatusEnum.overdue,
        jobs_enum_1.JobStatusEnum.cancelled,
        jobs_enum_1.JobStatusEnum.draft,
    ]);
    strict_1.default.deepEqual(result.counts, { completed: 1, pending: 2, overdue: 1, total: 4 });
    strict_1.default.deepEqual(result.percentages, { completed: 25, pending: 50, overdue: 25 });
    strict_1.default.equal(Object.values(result.percentages).reduce((sum, value) => sum + value, 0), 100);
});
(0, node_test_1.default)("all-time dashboard range has no lower date boundary", () => {
    const range = (0, dashboard_service_1.dashboardPeriodRange)("all", new Date("2026-11-21T09:42:15.000Z"));
    strict_1.default.equal(range.startDate, null);
    strict_1.default.equal(range.label, "All time");
});
