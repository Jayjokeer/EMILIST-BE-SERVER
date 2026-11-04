"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const admin_overview_service_1 = require("../src/services/admin-overview.service");
(0, node_test_1.default)("overview range defaults to 30 days and returns adjacent comparison windows", () => {
    const now = new Date("2026-11-04T12:00:00.000Z");
    const range = (0, admin_overview_service_1.overviewRange)(undefined, now);
    strict_1.default.equal(range.range, "30d");
    strict_1.default.equal(range.days, 30);
    strict_1.default.equal(range.currentEnd.toISOString(), now.toISOString());
    strict_1.default.equal(range.currentStart.toISOString(), "2026-10-05T12:00:00.000Z");
    strict_1.default.equal(range.previousEnd.toISOString(), range.currentStart.toISOString());
    strict_1.default.equal(range.previousStart.toISOString(), "2026-09-05T12:00:00.000Z");
});
(0, node_test_1.default)("overview range accepts supported values and falls back for unknown values", () => {
    const now = new Date("2026-11-04T12:00:00.000Z");
    strict_1.default.equal((0, admin_overview_service_1.overviewRange)("7D", now).days, 7);
    strict_1.default.equal((0, admin_overview_service_1.overviewRange)("90d", now).days, 90);
    strict_1.default.equal((0, admin_overview_service_1.overviewRange)("12m", now).days, 365);
    strict_1.default.equal((0, admin_overview_service_1.overviewRange)("all", now).range, "30d");
});
(0, node_test_1.default)("percentage change handles growth, decline, rounding, and zero baselines", () => {
    strict_1.default.equal((0, admin_overview_service_1.percentageChange)(125, 100), 25);
    strict_1.default.equal((0, admin_overview_service_1.percentageChange)(75, 100), -25);
    strict_1.default.equal((0, admin_overview_service_1.percentageChange)(1, 3), -66.67);
    strict_1.default.equal((0, admin_overview_service_1.percentageChange)(10, 0), 100);
    strict_1.default.equal((0, admin_overview_service_1.percentageChange)(0, 0), 0);
});
