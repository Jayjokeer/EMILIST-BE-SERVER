"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const job_payment_service_1 = require("../src/services/job-payment.service");
const walletService = __importStar(require("../src/services/wallet.services"));
(0, node_test_1.default)("successful job payment completes the transaction and marks the invoice paid", () => {
    const milestoneId = "6ab584cbcff7d52841928b9a";
    const completedAt = new Date("2026-11-16T10:00:00.000Z");
    const job = {
        milestones: [{
                _id: milestoneId,
                paymentStatus: "processing",
                paymentInfo: {},
                invoice: { invoiceRaised: true, reviewStatus: "pending" },
            }],
    };
    const transaction = {
        milestoneId,
        amount: 25000,
        paymentMethod: "Card",
        reference: "PS-JOB-001",
        status: "processing",
    };
    const result = (0, job_payment_service_1.applySuccessfulJobPayment)(job, transaction, completedAt);
    strict_1.default.equal(result.milestone.paymentStatus, "paid");
    strict_1.default.equal(result.milestone.invoice.reviewStatus, "paid");
    strict_1.default.equal(result.milestone.paymentInfo.amountPaid, 25000);
    strict_1.default.equal(result.milestone.paymentInfo.referenceId, "PS-JOB-001");
    strict_1.default.equal(result.transaction.status, "completed");
    strict_1.default.equal(result.transaction.dateCompleted, completedAt);
});
(0, node_test_1.default)("successful job payment is idempotent for already-paid milestones", () => {
    const milestoneId = "6ab584cbcff7d52841928b9a";
    const paidAt = new Date("2026-11-16T09:00:00.000Z");
    const job = {
        milestones: [{
                _id: milestoneId,
                paymentStatus: "paid",
                datePaid: paidAt,
                paymentInfo: { amountPaid: 25000, paymentMethod: "Card", date: paidAt },
                invoice: { invoiceRaised: true, reviewStatus: "paid" },
            }],
    };
    const transaction = {
        milestoneId,
        amount: 25000,
        paymentMethod: "Card",
        status: "completed",
        dateCompleted: paidAt,
    };
    (0, job_payment_service_1.applySuccessfulJobPayment)(job, transaction, new Date("2026-11-16T11:00:00.000Z"));
    strict_1.default.equal(job.milestones[0].datePaid, paidAt);
    strict_1.default.equal(transaction.dateCompleted, paidAt);
});
(0, node_test_1.default)("reconciles a successful legacy processing payment", async () => {
    const milestone = {
        _id: "milestone-1",
        paymentStatus: "processing",
        paymentInfo: {},
        invoice: { invoiceRaised: true, reviewStatus: "pending" },
    };
    const job = {
        milestones: [milestone],
        markModified() { },
        async save() { return this; },
    };
    const transaction = {
        milestoneId: milestone._id,
        jobId: "job-1",
        serviceType: "Job",
        paymentMethod: "Card",
        reference: "PS-SUCCESS",
        amount: 40_000,
        status: "processing",
        async save() { return this; },
    };
    const result = await (0, job_payment_service_1.reconcileProcessingJobPayment)(job, milestone, transaction, async () => "success");
    strict_1.default.equal(result.outcome, "completed");
    strict_1.default.equal(transaction.status, "completed");
    strict_1.default.equal(milestone.paymentStatus, "paid");
    strict_1.default.equal(milestone.invoice.reviewStatus, "paid");
});
(0, node_test_1.default)("releases an unsuccessful legacy processing payment for retry", async () => {
    const milestone = {
        _id: "milestone-1",
        paymentStatus: "processing",
        paymentInfo: {},
        invoice: { invoiceRaised: true, reviewStatus: "pending" },
    };
    const job = {
        milestones: [milestone],
        markModified() { },
        async save() { return this; },
    };
    const transaction = {
        milestoneId: milestone._id,
        jobId: "job-1",
        serviceType: "Job",
        paymentMethod: "Card",
        reference: "PS-FAILED",
        amount: 40_000,
        status: "processing",
        async save() { return this; },
    };
    const result = await (0, job_payment_service_1.reconcileProcessingJobPayment)(job, milestone, transaction, async () => "failed");
    strict_1.default.equal(result.outcome, "retry");
    strict_1.default.equal(transaction.status, "failed");
    strict_1.default.equal(milestone.paymentStatus, "unpaid");
});
(0, node_test_1.default)("settlement credits the artisan wallet and marks the payment successful", async (t) => {
    const originalCredit = walletService.creditJobPaymentSettlement;
    let credited = null;
    walletService.creditJobPaymentSettlement = async (...args) => {
        credited = args;
        return { _id: "artisan-wallet", balance: 5000 };
    };
    t.after(() => { walletService.creditJobPaymentSettlement = originalCredit; });
    const transaction = {
        _id: "transaction-1",
        userId: "owner-1",
        recieverId: "artisan-1",
        serviceType: "Job",
        currency: "NGN",
        amount: 5000,
        status: "completed",
        isSettled: false,
        async save() { return this; },
    };
    const result = await (0, job_payment_service_1.settleJobPaymentToArtisan)(transaction);
    strict_1.default.deepEqual(credited, ["artisan-1", "NGN", 5000, "transaction-1"]);
    strict_1.default.equal(transaction.isSettled, true);
    strict_1.default.equal(result.alreadySettled, false);
});
