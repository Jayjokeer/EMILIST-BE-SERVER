"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const job_service_1 = require("../src/services/job.service");
(0, node_test_1.default)("job owner name uses first and last names", () => {
    strict_1.default.equal((0, job_service_1.resolveJobOwnerName)({ firstName: "John", lastName: "Doe", userName: "johnny" }), "John Doe");
});
(0, node_test_1.default)("job owner name supports incomplete legacy profiles", () => {
    strict_1.default.equal((0, job_service_1.resolveJobOwnerName)({ userName: "johnny" }), "johnny");
    strict_1.default.equal((0, job_service_1.resolveJobOwnerName)({ email: "john@example.com" }), "john");
    strict_1.default.equal((0, job_service_1.resolveJobOwnerName)(null), null);
});
