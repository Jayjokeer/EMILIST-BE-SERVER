"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const transaction_enum_1 = require("../src/enums/transaction.enum");
const transaction_service_1 = require("../src/services/transaction.service");
const walletId = "6a21f270d23c3015a245cc87";
(0, node_test_1.default)("wallet transaction scope includes same-currency external and incoming payments by default", () => {
    const recipientId = "6a21f270d23c3015a245cc84";
    const condition = (0, transaction_service_1.buildWalletTransactionScopeCondition)(walletId, "NGN", true, recipientId);
    strict_1.default.equal(String(condition.$or[0].walletId), walletId);
    strict_1.default.deepEqual(condition.$or[1], {
        walletId: null,
        currency: "NGN",
        paymentService: { $in: Object.values(transaction_enum_1.PaymentServiceEnum) },
    });
    strict_1.default.equal(String(condition.$or[2].recieverId), recipientId);
    strict_1.default.equal(condition.$or[2].currency, "NGN");
});
(0, node_test_1.default)("wallet transaction scope can be restricted to wallet-only payments", () => {
    const condition = (0, transaction_service_1.buildWalletTransactionScopeCondition)(walletId, "NGN", false);
    strict_1.default.equal(String(condition.walletId), walletId);
    strict_1.default.equal(condition.$or, undefined);
});
(0, node_test_1.default)("artisan payment status follows pending, processing, and settled lifecycle", () => {
    const artisanId = "6a21f270d23c3015a245cc84";
    const base = { userId: "6ab555c36fc013d4563af969", recieverId: artisanId, serviceType: "Job", type: "DEBIT" };
    strict_1.default.equal((0, transaction_service_1.userTransactionDisplayStatus)({ ...base, status: "pending", isSettled: false }, artisanId), "pending");
    strict_1.default.equal((0, transaction_service_1.userTransactionDisplayStatus)({ ...base, status: "completed", isSettled: false }, artisanId), "processing");
    strict_1.default.equal((0, transaction_service_1.userTransactionDisplayStatus)({ ...base, status: "completed", isSettled: true }, artisanId), "successful");
    strict_1.default.equal((0, transaction_service_1.userTransactionDisplayType)(base, artisanId), "inflow");
});
