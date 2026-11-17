"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const job_validation_1 = require("../src/validations/job.validation");
(0, node_test_1.default)("fetch jobs by status accepts and converts pagination query parameters", () => {
    const req = {
        query: { status: "active", page: "2", limit: "25", orderBy: "oldest" },
    };
    let nextCalled = false;
    (0, job_validation_1.validateFetchJobsByStatus)(req, {}, () => {
        nextCalled = true;
    });
    strict_1.default.equal(nextCalled, true);
    strict_1.default.equal(req.query.page, 2);
    strict_1.default.equal(req.query.limit, 25);
    strict_1.default.equal(req.query.orderBy, "oldest");
});
(0, node_test_1.default)("fetch jobs by status applies pagination defaults", () => {
    const req = { query: { status: "active" } };
    let nextCalled = false;
    (0, job_validation_1.validateFetchJobsByStatus)(req, {}, () => {
        nextCalled = true;
    });
    strict_1.default.equal(nextCalled, true);
    strict_1.default.equal(req.query.page, 1);
    strict_1.default.equal(req.query.limit, 10);
    strict_1.default.equal(req.query.orderBy, "newest");
});
(0, node_test_1.default)("fetch jobs by status rejects an invalid page or excessive limit", () => {
    const req = { query: { status: "active", page: "0", limit: "101" } };
    let statusCode;
    let responseBody;
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(body) {
            responseBody = body;
            return this;
        },
    };
    (0, job_validation_1.validateFetchJobsByStatus)(req, res, () => {
        throw new Error("next must not be called for an invalid query");
    });
    strict_1.default.equal(statusCode, 400);
    strict_1.default.equal(responseBody.errors.length, 2);
});
(0, node_test_1.default)("job analytics validates and converts year and month", () => {
    const req = { query: { year: "2026", month: "11" } };
    let nextCalled = false;
    (0, job_validation_1.validateJobAnalyticsQuery)(req, {}, () => { nextCalled = true; });
    strict_1.default.equal(nextCalled, true);
    strict_1.default.equal(req.query.year, 2026);
    strict_1.default.equal(req.query.month, 11);
});
(0, node_test_1.default)("job analytics requires a complete date range", () => {
    const req = { query: { startDate: "2026-11-01" } };
    let statusCode;
    const res = {
        status(code) { statusCode = code; return this; },
        json() { return this; },
    };
    (0, job_validation_1.validateJobAnalyticsQuery)(req, res, () => {
        throw new Error("next must not be called for an incomplete date range");
    });
    strict_1.default.equal(statusCode, 400);
});
(0, node_test_1.default)("direct-job and quote responses accept only terminal decisions", () => {
    for (const validator of [job_validation_1.validateDirectJobResponse, job_validation_1.validateQuoteStatusUpdate]) {
        const acceptedReq = { body: { status: "accepted" } };
        let nextCalled = false;
        validator(acceptedReq, {}, () => { nextCalled = true; });
        strict_1.default.equal(nextCalled, true);
        const invalidReq = { body: { status: "pending" } };
        let statusCode;
        const res = {
            status(code) { statusCode = code; return this; },
            json() { return this; },
        };
        validator(invalidReq, res, () => {
            throw new Error("next must not be called for a non-terminal response");
        });
        strict_1.default.equal(statusCode, 400);
    }
});
