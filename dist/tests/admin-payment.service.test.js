"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const transaction_enum_1 = require("../src/enums/transaction.enum");
const admin_payment_service_1 = require("../src/services/admin-payment.service");
(0, node_test_1.default)("admin payment pagination is bounded", () => {
    strict_1.default.deepEqual((0, admin_payment_service_1.adminPaymentPagination)(undefined, undefined), { page: 1, limit: 10, skip: 0 });
    strict_1.default.deepEqual((0, admin_payment_service_1.adminPaymentPagination)("3", "25"), { page: 3, limit: 25, skip: 50 });
    strict_1.default.deepEqual((0, admin_payment_service_1.adminPaymentPagination)("-1", "500"), { page: 1, limit: 100, skip: 0 });
});
(0, node_test_1.default)("credit and debit ledger entries map to inflow and outflow", () => {
    strict_1.default.equal((0, admin_payment_service_1.adminPaymentDirection)({ type: transaction_enum_1.TransactionType.CREDIT }), "inflow");
    strict_1.default.equal((0, admin_payment_service_1.adminPaymentDirection)({ type: transaction_enum_1.TransactionType.DEBIT }), "outflow");
});
(0, node_test_1.default)("payment serialization uses explicit counterparty before populated users", () => {
    const payment = (0, admin_payment_service_1.serializeAdminPayment)({
        _id: "transaction-id", reference: "PYM-123", createdAt: new Date("2026-09-12T12:15:00.000Z"),
        counterparty: "Johnson O. Oluwole", userId: { firstName: "Sender" }, recieverId: { firstName: "Receiver" },
        type: transaction_enum_1.TransactionType.CREDIT, amount: 850000, currency: "NGN", status: "completed",
        paymentMethod: "BankTransfer", description: "Material Sale",
    });
    strict_1.default.equal(payment.counterparty, "Johnson O. Oluwole");
    strict_1.default.equal(payment.direction, "inflow");
    strict_1.default.equal(payment.transactionId, "PYM-123");
});
