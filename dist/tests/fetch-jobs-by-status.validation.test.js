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
