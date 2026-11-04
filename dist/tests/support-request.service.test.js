"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const support_request_service_1 = require("../src/services/support-request.service");
(0, node_test_1.default)("support request pagination is bounded and deterministic", () => {
    strict_1.default.deepEqual((0, support_request_service_1.supportPagination)(undefined, undefined), { page: 1, limit: 10, skip: 0 });
    strict_1.default.deepEqual((0, support_request_service_1.supportPagination)("2", "20"), { page: 2, limit: 20, skip: 20 });
    strict_1.default.deepEqual((0, support_request_service_1.supportPagination)("0", "1000"), { page: 1, limit: 100, skip: 0 });
});
