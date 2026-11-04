"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const transaction_enum_1 = require("../src/enums/transaction.enum");
const admin_customer_service_1 = require("../src/services/admin-customer.service");
(0, node_test_1.default)('customer pagination applies defaults, bounds, and offsets', () => {
    strict_1.default.deepEqual((0, admin_customer_service_1.customerPagination)(undefined, undefined), { page: 1, limit: 10, skip: 0 });
    strict_1.default.deepEqual((0, admin_customer_service_1.customerPagination)('3', '25'), { page: 3, limit: 25, skip: 50 });
    strict_1.default.deepEqual((0, admin_customer_service_1.customerPagination)('-2', '500'), { page: 1, limit: 100, skip: 0 });
});
(0, node_test_1.default)('received transfers are inflows from the viewed customer perspective', () => {
    strict_1.default.equal((0, admin_customer_service_1.customerTransactionDirection)({
        userId: 'sender',
        recieverId: 'customer',
        type: transaction_enum_1.TransactionType.DEBIT,
    }, 'customer'), 'inflow');
    strict_1.default.equal((0, admin_customer_service_1.customerTransactionDirection)({
        userId: 'customer',
        recieverId: 'merchant',
        type: transaction_enum_1.TransactionType.DEBIT,
    }, 'customer'), 'outflow');
    strict_1.default.equal((0, admin_customer_service_1.customerTransactionDirection)({
        userId: 'customer',
        type: transaction_enum_1.TransactionType.CREDIT,
    }, 'customer'), 'inflow');
});
(0, node_test_1.default)('wallet balance change is stable when no historical balance exists', () => {
    strict_1.default.equal((0, admin_customer_service_1.walletBalanceChangePercentage)(9_450_000, 9_000_000), 5);
    strict_1.default.equal((0, admin_customer_service_1.walletBalanceChangePercentage)(9_450_000, 0), 0);
    strict_1.default.equal((0, admin_customer_service_1.walletBalanceChangePercentage)(9_450_000, null), 0);
});
