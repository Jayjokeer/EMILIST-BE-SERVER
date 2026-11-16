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
Object.defineProperty(exports, "__esModule", { value: true });
exports.reconcileProcessingJobPayment = exports.settleJobPaymentToArtisan = exports.completeJobPayment = exports.applySuccessfulJobPayment = void 0;
const error_1 = require("../errors/error");
const jobs_enum_1 = require("../enums/jobs.enum");
const transaction_enum_1 = require("../enums/transaction.enum");
const paystack_1 = require("../utils/paystack");
const jobService = __importStar(require("./job.service"));
const walletService = __importStar(require("./wallet.services"));
const applySuccessfulJobPayment = (job, transaction, completedAt = new Date()) => {
    const milestone = (job.milestones || []).find((item) => String(item._id) === String(transaction.milestoneId));
    if (!milestone)
        throw new error_1.NotFoundError("Milestone not found for this payment");
    milestone.paymentStatus = jobs_enum_1.MilestonePaymentStatus.paid;
    milestone.datePaid = milestone.datePaid || completedAt;
    milestone.paymentInfo = {
        ...(milestone.paymentInfo?.toObject?.() || milestone.paymentInfo || {}),
        amountPaid: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        date: completedAt,
        ...(transaction.paymentMethod === transaction_enum_1.PaymentMethodEnum.card && transaction.reference
            ? { referenceId: transaction.reference }
            : {}),
    };
    if (milestone.invoice)
        milestone.invoice.reviewStatus = "paid";
    transaction.status = transaction_enum_1.TransactionEnum.completed;
    transaction.dateCompleted = transaction.dateCompleted || completedAt;
    return { job, milestone, transaction };
};
exports.applySuccessfulJobPayment = applySuccessfulJobPayment;
const completeJobPayment = async (transaction) => {
    if (!transaction || transaction.serviceType !== transaction_enum_1.ServiceEnum.job) {
        throw new error_1.BadRequestError("This is not a job payment transaction");
    }
    if (!transaction.jobId || !transaction.milestoneId) {
        throw new error_1.BadRequestError("Job payment transaction is missing its job or milestone ID");
    }
    const job = await jobService.fetchJobById(String(transaction.jobId));
    if (!job)
        throw new error_1.NotFoundError("Job not found");
    (0, exports.applySuccessfulJobPayment)(job, transaction);
    await Promise.all([job.save(), transaction.save()]);
    return { job, transaction };
};
exports.completeJobPayment = completeJobPayment;
const settleJobPaymentToArtisan = async (transaction) => {
    if (!transaction || transaction.serviceType !== transaction_enum_1.ServiceEnum.job) {
        throw new error_1.BadRequestError("This is not a job payment transaction");
    }
    if (transaction.status !== transaction_enum_1.TransactionEnum.completed) {
        throw new error_1.BadRequestError("Job payment must be confirmed before it can be settled");
    }
    if (!transaction.recieverId)
        throw new error_1.BadRequestError("Job payment receiver is missing");
    if (!transaction.currency)
        throw new error_1.BadRequestError("Job payment currency is missing");
    if (transaction.isSettled)
        return { transaction, wallet: null, alreadySettled: true };
    const wallet = await walletService.creditJobPaymentSettlement(String(transaction.recieverId?._id || transaction.recieverId), transaction.currency, Number(transaction.amount), String(transaction._id));
    transaction.isSettled = true;
    await transaction.save();
    return { transaction, wallet, alreadySettled: false };
};
exports.settleJobPaymentToArtisan = settleJobPaymentToArtisan;
// Repairs milestones left in `processing` by the legacy payment flow. A
// successful charge is finalized; an unsuccessful/abandoned card attempt is
// failed and the milestone is released so the owner can initialize a new one.
const reconcileProcessingJobPayment = async (job, milestone, transaction, verifyPayment = paystack_1.verifyPaystackPayment) => {
    const finalizeExistingPayment = async () => {
        (0, exports.applySuccessfulJobPayment)(job, transaction);
        await Promise.all([job.save(), transaction.save()]);
    };
    if (!transaction) {
        milestone.paymentStatus = jobs_enum_1.MilestonePaymentStatus.unpaid;
        job.markModified?.("milestones");
        await job.save();
        return { outcome: "retry", transaction: null };
    }
    if (transaction.status === transaction_enum_1.TransactionEnum.completed ||
        transaction.paymentMethod === transaction_enum_1.PaymentMethodEnum.wallet) {
        await finalizeExistingPayment();
        return { outcome: "completed", transaction };
    }
    if (transaction.reference) {
        const paystackStatus = await verifyPayment(String(transaction.reference));
        if (paystackStatus === "success") {
            await finalizeExistingPayment();
            return { outcome: "completed", transaction };
        }
    }
    transaction.status = transaction_enum_1.TransactionEnum.failed;
    transaction.dateCompleted = new Date();
    milestone.paymentStatus = jobs_enum_1.MilestonePaymentStatus.unpaid;
    job.markModified?.("milestones");
    await Promise.all([job.save(), transaction.save()]);
    return { outcome: "retry", transaction };
};
exports.reconcileProcessingJobPayment = reconcileProcessingJobPayment;
