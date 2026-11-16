"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const support_request_service_1 = require("../src/services/support-request.service");
const support_enum_1 = require("../src/enums/support.enum");
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
    const result = (0, support_request_service_1.invoiceDisputeMilestone)(job, "6a21f270d23c3015a245cc84", "6ab584cbcff7d52841928b9a", "6ab584cbcff7d52841928b9b");
    strict_1.default.equal(String(result.milestone._id), "6ab584cbcff7d52841928b9a");
    strict_1.default.equal(result.raisedByRole, "job_owner");
});
(0, node_test_1.default)("invoice dispute rejects a requester who is not the job owner", () => {
    const job = { userId: "owner", milestones: [] };
    strict_1.default.throws(() => (0, support_request_service_1.invoiceDisputeMilestone)(job, "another-user", "milestone"), /Only the job owner or accepted artisan/);
});
(0, node_test_1.default)("job owner can dispute unsatisfactory work after an invoice was paid", () => {
    const job = {
        userId: "owner",
        milestones: [{
                _id: "milestone",
                paymentStatus: "paid",
                invoice: { invoiceRaised: true, invoiceId: "invoice" },
            }],
    };
    const result = (0, support_request_service_1.invoiceDisputeMilestone)(job, "owner", "milestone", "invoice", support_enum_1.InvoiceDisputeType.ownerUnsatisfiedWork);
    strict_1.default.equal(result.raisedByRole, "job_owner");
});
(0, node_test_1.default)("artisan can dispute an unpaid additional cost after the original amount was paid", () => {
    const job = {
        userId: "owner",
        milestones: [{
                _id: "milestone",
                amount: 5000,
                paymentStatus: "paid",
                paymentInfo: { amountPaid: 5000 },
                invoice: { invoiceRaised: true, invoiceId: "invoice", additionalAmount: 1000 },
            }],
    };
    const result = (0, support_request_service_1.invoiceDisputeMilestone)(job, "artisan", "milestone", "invoice", support_enum_1.InvoiceDisputeType.artisanAdditionalCostUnpaid, "artisan");
    strict_1.default.equal(result.raisedByRole, "artisan");
});
(0, node_test_1.default)("artisan can dispute an invoice unpaid beyond the seven-day grace period", () => {
    const now = new Date("2026-11-17T12:00:00.000Z");
    const job = {
        userId: "owner",
        milestones: [{
                _id: "milestone",
                paymentStatus: "unpaid",
                invoice: { invoiceRaised: true, invoiceId: "invoice", issuedAt: "2026-11-09T12:00:00.000Z" },
            }],
    };
    const result = (0, support_request_service_1.invoiceDisputeMilestone)(job, "artisan", "milestone", "invoice", support_enum_1.InvoiceDisputeType.artisanInvoiceUnpaidOverdue, "artisan", now);
    strict_1.default.equal(result.raisedByRole, "artisan");
});
