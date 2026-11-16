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
(0, node_test_1.default)("invoice dispute resolves the exact raised invoice for the job owner", () => {
    const job = {
        userId: "6a21f270d23c3015a245cc84",
        milestones: [{
                _id: "6ab584cbcff7d52841928b9a",
                invoice: { invoiceRaised: true, invoiceId: "6ab584cbcff7d52841928b9b" },
            }],
    };
    const milestone = (0, support_request_service_1.invoiceDisputeMilestone)(job, "6a21f270d23c3015a245cc84", "6ab584cbcff7d52841928b9a", "6ab584cbcff7d52841928b9b");
    strict_1.default.equal(String(milestone._id), "6ab584cbcff7d52841928b9a");
});
(0, node_test_1.default)("invoice dispute rejects a requester who is not the job owner", () => {
    const job = { userId: "owner", milestones: [] };
    strict_1.default.throws(() => (0, support_request_service_1.invoiceDisputeMilestone)(job, "another-user", "milestone"), /Only the job owner/);
});
(0, node_test_1.default)("invoice dispute rejects an invoice that has already been paid", () => {
    const job = {
        userId: "owner",
        milestones: [{
                _id: "milestone",
                paymentStatus: "paid",
                invoice: { invoiceRaised: true, invoiceId: "invoice" },
            }],
    };
    strict_1.default.throws(() => (0, support_request_service_1.invoiceDisputeMilestone)(job, "owner", "milestone", "invoice"), /paid invoice cannot be disputed/i);
});
