"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
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
        periods: [],
    });
});
