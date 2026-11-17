"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const mongoose_1 = require("mongoose");
const target_model_1 = __importDefault(require("../src/models/target.model"));
const jobs_model_1 = __importDefault(require("../src/models/jobs.model"));
const report_event_model_1 = __importDefault(require("../src/models/report-event.model"));
const report_event_service_1 = require("../src/services/report-event.service");
const user_report_service_1 = require("../src/services/user-report.service");
(0, node_test_1.default)('monthly report range uses the complete UTC calendar month', () => {
    const range = (0, user_report_service_1.resolveReportRange)({ year: 2026, month: 4 });
    strict_1.default.equal(range.startDate.toISOString(), '2026-04-01T00:00:00.000Z');
    strict_1.default.equal(range.endDate.toISOString(), '2026-04-30T23:59:59.999Z');
    strict_1.default.equal(range.month, 4);
});
(0, node_test_1.default)('last 30 days includes today and exactly 29 preceding days', () => {
    const range = (0, user_report_service_1.resolveReportRange)({ range: 'last30days' }, new Date('2026-04-30T12:00:00.000Z'));
    strict_1.default.equal(range.startDate.toISOString(), '2026-04-01T00:00:00.000Z');
    strict_1.default.equal(range.endDate.toISOString(), '2026-04-30T23:59:59.999Z');
});
(0, node_test_1.default)('invalid and oversized report ranges are rejected', () => {
    strict_1.default.throws(() => (0, user_report_service_1.resolveReportRange)({ year: 2026, month: 13 }), /Month must be between/);
    strict_1.default.throws(() => (0, user_report_service_1.resolveReportRange)({ startDate: '2026-02-30', endDate: '2026-03-01' }), /valid calendar date/);
    strict_1.default.throws(() => (0, user_report_service_1.resolveReportRange)({ startDate: '2025-01-01', endDate: '2026-12-31' }), /cannot exceed 366 days/);
});
(0, node_test_1.default)('target save upserts the selected period rather than creating duplicates', async () => {
    const originalFindOneAndUpdate = target_model_1.default.findOneAndUpdate;
    let filter;
    let update;
    target_model_1.default.findOneAndUpdate = async (query, value) => {
        filter = query;
        update = value;
        return { _id: new mongoose_1.Types.ObjectId(), ...value.$set };
    };
    try {
        const result = await (0, user_report_service_1.upsertUserTarget)(new mongoose_1.Types.ObjectId().toString(), {
            duration: 'monthly', year: 2026, month: 4, currency: 'NGN',
            job: 2, amount: 150000, referrals: 15, invites: 24,
        });
        strict_1.default.equal(filter.duration, 'monthly');
        strict_1.default.equal(filter.year, 2026);
        strict_1.default.equal(filter.month, 4);
        strict_1.default.equal(update.$set.amount, 150000);
        strict_1.default.equal(result.invites, 24);
    }
    finally {
        target_model_1.default.findOneAndUpdate = originalFindOneAndUpdate;
    }
});
(0, node_test_1.default)('CSV export includes every designed report section', () => {
    const report = {
        filters: { startDate: new Date('2026-04-01'), endDate: new Date('2026-04-30'), currency: 'NGN' },
        jobs: { total: 1, active: 1 },
        applications: { applicants: { total: 2 }, myApplications: { total: 3 } },
        finance: { earnings: { total: 100, categories: { jobs: 100 } }, expenses: { total: 20, categories: { materials: 20 } } },
        trade: { orders: { total: 1 }, sales: { total: 2 } },
        insights: { overview: { clicks: 4 }, promotionDuration: { totalDays: 30 }, clicks: { total: 4 }, targets: { goals: { jobs: 2 }, actual: { jobs: 1 }, progress: { overall: 50 } } },
    };
    const csv = (0, user_report_service_1.buildUserReportCsv)(report);
    for (const section of ['Jobs', 'Applications - Applicants', 'Applications - Mine', 'Earnings', 'Expenses', 'Orders', 'Sales', 'Insights', 'Promotion Duration', 'Click Performance', 'Targets - Goals', 'Targets - Actual', 'Targets - Progress']) {
        strict_1.default.match(csv, new RegExp(section));
    }
});
(0, node_test_1.default)('report events resolve the listing owner on the backend', async () => {
    const originalFindById = jobs_model_1.default.findById;
    const originalCreate = report_event_model_1.default.create;
    const ownerId = new mongoose_1.Types.ObjectId();
    const actorId = new mongoose_1.Types.ObjectId();
    const jobId = new mongoose_1.Types.ObjectId();
    let created;
    jobs_model_1.default.findById = () => ({
        select: () => ({ lean: async () => ({ _id: jobId, userId: ownerId }) }),
    });
    report_event_model_1.default.create = async (value) => {
        created = value;
        return { _id: new mongoose_1.Types.ObjectId(), ...value };
    };
    try {
        await (0, report_event_service_1.recordResourceReportEvent)({
            actorUserId: actorId.toString(),
            type: 'impression',
            resourceType: 'job',
            resourceId: jobId.toString(),
        });
        strict_1.default.equal(String(created.subjectUserId), ownerId.toString());
        strict_1.default.equal(String(created.actorUserId), actorId.toString());
        strict_1.default.equal(created.type, 'impression');
    }
    finally {
        jobs_model_1.default.findById = originalFindById;
        report_event_model_1.default.create = originalCreate;
    }
});
