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
const node_crypto_1 = __importDefault(require("node:crypto"));
const wallet_model_1 = __importDefault(require("../src/models/wallet.model"));
const transaction_model_1 = __importDefault(require("../src/models/transaction.model"));
const jobService = __importStar(require("../src/services/job.service"));
const webhook_controller_1 = require("../src/controllers/webhook.controller");
const config_1 = require("../src/utils/config");
const transaction_enum_1 = require("../src/enums/transaction.enum");
const invokePaystackWebhook = async (event, signatureIsValid = true) => {
    const body = Buffer.from(JSON.stringify(event));
    const signature = signatureIsValid
        ? node_crypto_1.default.createHmac("sha512", config_1.config.paystackSecretKey).update(body).digest("hex")
        : "invalid-signature";
    let statusCode = 0;
    let responseBody;
    const req = { body, headers: { "x-paystack-signature": signature } };
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(payload) {
            responseBody = payload;
            return this;
        },
    };
    await (0, webhook_controller_1.paystackWebhookController)(req, res);
    return { statusCode, responseBody };
};
(0, node_test_1.default)("simulates wallet funding and job payment through duplicate Paystack webhooks", async (t) => {
    const originalSecret = config_1.config.paystackSecretKey;
    const originalTransactionFindOne = transaction_model_1.default.findOne;
    const originalWalletUpdateOne = wallet_model_1.default.updateOne;
    const originalWalletFindById = wallet_model_1.default.findById;
    const originalFetchJobById = jobService.fetchJobById;
    config_1.config.paystackSecretKey = "payment-flow-simulation-secret";
    const wallet = {
        _id: "wallet-1",
        balance: 10_000,
        appliedAdjustments: [],
    };
    const walletTransaction = {
        _id: "wallet-transaction-1",
        reference: "PS-WALLET-SIMULATION",
        type: transaction_enum_1.TransactionType.CREDIT,
        serviceType: transaction_enum_1.ServiceEnum.walletFunding,
        paymentMethod: transaction_enum_1.PaymentMethodEnum.card,
        walletId: wallet._id,
        amount: 25_000,
        status: transaction_enum_1.TransactionEnum.pending,
        saveCount: 0,
        async save() { this.saveCount += 1; return this; },
    };
    const job = {
        _id: "job-1",
        saveCount: 0,
        milestones: [{
                _id: "milestone-1",
                paymentStatus: "unpaid",
                paymentInfo: {},
                invoice: { invoiceRaised: true, reviewStatus: "pending" },
            }],
        async save() { this.saveCount += 1; return this; },
    };
    const jobTransaction = {
        _id: "job-transaction-1",
        reference: "PS-JOB-SIMULATION",
        type: transaction_enum_1.TransactionType.DEBIT,
        serviceType: transaction_enum_1.ServiceEnum.job,
        paymentMethod: transaction_enum_1.PaymentMethodEnum.card,
        jobId: job._id,
        milestoneId: "milestone-1",
        amount: 40_000,
        status: transaction_enum_1.TransactionEnum.pending,
        saveCount: 0,
        async save() { this.saveCount += 1; return this; },
    };
    const transactions = new Map([
        [walletTransaction.reference, walletTransaction],
        [jobTransaction.reference, jobTransaction],
    ]);
    transaction_model_1.default.findOne = async ({ reference }) => transactions.get(reference) || null;
    wallet_model_1.default.updateOne = async (_filter, update) => {
        const reference = update.$addToSet.appliedAdjustments;
        if (!wallet.appliedAdjustments.includes(reference)) {
            wallet.balance += update.$inc.balance;
            wallet.appliedAdjustments.push(reference);
            return { modifiedCount: 1 };
        }
        return { modifiedCount: 0 };
    };
    wallet_model_1.default.findById = async (walletId) => walletId === wallet._id ? wallet : null;
    jobService.fetchJobById = async (jobId) => jobId === job._id ? job : null;
    t.after(() => {
        config_1.config.paystackSecretKey = originalSecret;
        transaction_model_1.default.findOne = originalTransactionFindOne;
        wallet_model_1.default.updateOne = originalWalletUpdateOne;
        wallet_model_1.default.findById = originalWalletFindById;
        jobService.fetchJobById = originalFetchJobById;
    });
    const invalid = await invokePaystackWebhook({
        event: "charge.success",
        data: { reference: walletTransaction.reference },
    }, false);
    strict_1.default.equal(invalid.statusCode, 401);
    strict_1.default.equal(wallet.balance, 10_000);
    const walletEvent = { event: "charge.success", data: { reference: walletTransaction.reference } };
    strict_1.default.equal((await invokePaystackWebhook(walletEvent)).statusCode, 200);
    strict_1.default.equal(walletTransaction.status, transaction_enum_1.TransactionEnum.completed);
    strict_1.default.equal(walletTransaction.balanceAfter, 35_000);
    strict_1.default.equal(wallet.balance, 35_000);
    strict_1.default.deepEqual(wallet.appliedAdjustments, [walletTransaction.reference]);
    strict_1.default.equal((await invokePaystackWebhook(walletEvent)).statusCode, 200);
    strict_1.default.equal(wallet.balance, 35_000, "duplicate webhook must not credit the wallet twice");
    strict_1.default.equal(walletTransaction.saveCount, 1);
    const jobEvent = { event: "charge.success", data: { reference: jobTransaction.reference } };
    strict_1.default.equal((await invokePaystackWebhook(jobEvent)).statusCode, 200);
    strict_1.default.equal(jobTransaction.status, transaction_enum_1.TransactionEnum.completed);
    strict_1.default.ok(jobTransaction.dateCompleted instanceof Date);
    strict_1.default.equal(job.milestones[0].paymentStatus, "paid");
    strict_1.default.equal(job.milestones[0].invoice.reviewStatus, "paid");
    strict_1.default.equal(job.milestones[0].paymentInfo.amountPaid, 40_000);
    strict_1.default.equal(job.milestones[0].paymentInfo.paymentMethod, transaction_enum_1.PaymentMethodEnum.card);
    strict_1.default.equal((await invokePaystackWebhook(jobEvent)).statusCode, 200);
    strict_1.default.equal(job.saveCount, 1, "duplicate webhook must not reapply the job payment");
    strict_1.default.equal(jobTransaction.saveCount, 1);
});
