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
exports.processAdminWithdrawal = exports.fetchAdminWithdrawals = exports.fetchAdminPayment = exports.fetchAdminPayments = exports.serializeAdminPayment = exports.fetchAdminPaymentSummary = exports.adminPaymentDirection = exports.adminPaymentPagination = void 0;
const mongoose_1 = require("mongoose");
const error_1 = require("../errors/error");
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const admin_action_model_1 = __importDefault(require("../models/admin-action.model"));
const transaction_enum_1 = require("../enums/transaction.enum");
const admin_overview_service_1 = require("./admin-overview.service");
const walletService = __importStar(require("./wallet.services"));
const adminPaymentPagination = (pageValue, limitValue) => {
    const page = Math.max(1, Number(pageValue) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
    return { page, limit, skip: (page - 1) * limit };
};
exports.adminPaymentPagination = adminPaymentPagination;
const adminPaymentDirection = (transaction) => transaction.type === transaction_enum_1.TransactionType.CREDIT ? "inflow" : "outflow";
exports.adminPaymentDirection = adminPaymentDirection;
const assertId = (value, label) => {
    if (!mongoose_1.Types.ObjectId.isValid(value))
        throw new error_1.BadRequestError(`Invalid ${label}`);
};
const amountAggregate = async (model, match, amountField = "$amount") => {
    const rows = await model.aggregate([
        { $match: match },
        { $group: { _id: null, amount: { $sum: amountField }, count: { $sum: 1 } } },
    ]);
    return { amount: rows[0]?.amount || 0, count: rows[0]?.count || 0 };
};
const comparison = async (match, range, dateField = "createdAt") => {
    const [current, previous] = await Promise.all([
        amountAggregate(transaction_model_1.default, { ...match, [dateField]: { $gte: range.currentStart, $lte: range.currentEnd } }),
        amountAggregate(transaction_model_1.default, { ...match, [dateField]: { $gte: range.previousStart, $lt: range.previousEnd } }),
    ]);
    return {
        currentAmount: current.amount, previousAmount: previous.amount,
        currentCount: current.count, previousCount: previous.count,
        percentageChange: (0, admin_overview_service_1.percentageChange)(current.amount, previous.amount),
    };
};
const fetchAdminPaymentSummary = async (rangeValue, currencyValue) => {
    const range = (0, admin_overview_service_1.overviewRange)(rangeValue);
    const currency = Object.values(transaction_enum_1.WalletEnum).includes(currencyValue)
        ? currencyValue : transaction_enum_1.WalletEnum.NGN;
    const escrowMatch = {
        currency,
        isSettled: false,
        status: { $in: [transaction_enum_1.TransactionEnum.completed, transaction_enum_1.TransactionEnum.processing] },
        $or: [{ jobId: { $exists: true, $ne: null } }, { orderId: { $exists: true, $ne: null } }],
    };
    const withdrawalMatch = { currency, serviceType: transaction_enum_1.ServiceEnum.withdrawal, status: transaction_enum_1.TransactionEnum.pending };
    const failedMatch = { currency, status: { $in: [transaction_enum_1.TransactionEnum.failed, transaction_enum_1.TransactionEnum.declined] } };
    const volumeMatch = { currency, status: transaction_enum_1.TransactionEnum.completed };
    const [escrow, walletRows, pendingWithdrawals, failedTransactions, grossVolume, escrowChange, withdrawalChange, failedChange, volumeChange] = await Promise.all([
        amountAggregate(transaction_model_1.default, escrowMatch),
        wallet_model_1.default.aggregate([{ $match: { currency } }, { $group: { _id: null, amount: { $sum: "$balance" }, count: { $sum: 1 } } }]),
        amountAggregate(transaction_model_1.default, withdrawalMatch),
        amountAggregate(transaction_model_1.default, { ...failedMatch, createdAt: { $gte: range.currentStart, $lte: range.currentEnd } }),
        amountAggregate(transaction_model_1.default, { ...volumeMatch, createdAt: { $gte: range.currentStart, $lte: range.currentEnd } }),
        comparison(escrowMatch, range),
        comparison(withdrawalMatch, range),
        comparison(failedMatch, range),
        comparison(volumeMatch, range),
    ]);
    const userBalance = { amount: walletRows[0]?.amount || 0, wallets: walletRows[0]?.count || 0 };
    return {
        range: range.range,
        currency,
        totalEscrowBalance: { ...escrow, activeRecords: escrow.count, change: escrowChange.percentageChange },
        totalUserBalance: userBalance,
        pendingWithdrawals: { ...pendingWithdrawals, requests: pendingWithdrawals.count, change: withdrawalChange.percentageChange },
        failedTransactions: { ...failedTransactions, value: failedTransactions.amount, change: failedChange.percentageChange },
        grossTransactionVolume: { ...grossVolume, change: volumeChange.percentageChange },
    };
};
exports.fetchAdminPaymentSummary = fetchAdminPaymentSummary;
const paymentFilter = async (query) => {
    const filter = {};
    if (query.currency)
        filter.currency = query.currency;
    if (query.type)
        filter.type = String(query.type).toUpperCase();
    if (query.paymentMethod)
        filter.paymentMethod = query.paymentMethod;
    if (query.serviceType)
        filter.serviceType = query.serviceType;
    if (query.status) {
        switch (String(query.status)) {
            case "successful":
                filter.status = transaction_enum_1.TransactionEnum.completed;
                break;
            case "pending":
                filter.status = { $in: [transaction_enum_1.TransactionEnum.pending, transaction_enum_1.TransactionEnum.processing] };
                break;
            case "failed":
                filter.status = { $in: [transaction_enum_1.TransactionEnum.failed, transaction_enum_1.TransactionEnum.declined] };
                break;
            default: filter.status = query.status;
        }
    }
    if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate)
            filter.createdAt.$gte = new Date(String(query.startDate));
        if (query.endDate) {
            const end = new Date(String(query.endDate));
            end.setUTCHours(23, 59, 59, 999);
            filter.createdAt.$lte = end;
        }
    }
    const search = String(query.search || "").trim();
    if (search) {
        const users = await users_model_1.default.find({ $or: [
                { firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } },
                { userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } },
            ] }).select("_id").lean();
        filter.$or = [
            { reference: { $regex: search, $options: "i" } }, { counterparty: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }, { userId: { $in: users.map((user) => user._id) } },
            { recieverId: { $in: users.map((user) => user._id) } },
            ...(mongoose_1.Types.ObjectId.isValid(search) ? [{ _id: new mongoose_1.Types.ObjectId(search) }] : []),
        ];
    }
    return filter;
};
const personName = (person) => person
    ? [person.firstName, person.lastName].filter(Boolean).join(" ") || person.userName || person.email || null
    : null;
const serializeAdminPayment = (transaction) => {
    const sender = transaction.userId;
    const receiver = transaction.recieverId;
    const direction = (0, exports.adminPaymentDirection)(transaction);
    const counterparty = transaction.counterparty
        || (direction === "inflow" ? personName(sender) : personName(receiver))
        || personName(receiver) || personName(sender) || null;
    return {
        id: transaction._id,
        transactionId: transaction.reference || String(transaction._id),
        date: transaction.dateCompleted || transaction.createdAt,
        counterparty,
        direction,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency || transaction_enum_1.WalletEnum.NGN,
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        description: transaction.description,
        serviceType: transaction.serviceType,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: transaction.balanceAfter,
        jobId: transaction.jobId?._id || transaction.jobId || null,
        orderId: transaction.orderId?._id || transaction.orderId || null,
        sender,
        receiver,
    };
};
exports.serializeAdminPayment = serializeAdminPayment;
const populatedPayments = (query) => query
    .populate("userId", "firstName lastName userName email uniqueId displayImage")
    .populate("recieverId", "firstName lastName userName email uniqueId displayImage")
    .populate("jobId", "title status")
    .populate("orderId", "paymentStatus deliveryStatus totalAmount");
const fetchAdminPayments = async (query) => {
    const { page, limit, skip } = (0, exports.adminPaymentPagination)(query.page, query.limit);
    const filter = await paymentFilter(query);
    const [transactions, total] = await Promise.all([
        populatedPayments(transaction_model_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)).lean(),
        transaction_model_1.default.countDocuments(filter),
    ]);
    return {
        transactions: transactions.map(exports.serializeAdminPayment),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
};
exports.fetchAdminPayments = fetchAdminPayments;
const fetchAdminPayment = async (transactionId) => {
    assertId(transactionId, "transaction id");
    const transaction = await populatedPayments(transaction_model_1.default.findById(transactionId)).lean();
    if (!transaction)
        throw new error_1.NotFoundError("Transaction not found");
    return (0, exports.serializeAdminPayment)(transaction);
};
exports.fetchAdminPayment = fetchAdminPayment;
const fetchAdminWithdrawals = async (query) => (0, exports.fetchAdminPayments)({
    ...query,
    serviceType: transaction_enum_1.ServiceEnum.withdrawal,
});
exports.fetchAdminWithdrawals = fetchAdminWithdrawals;
const processAdminWithdrawal = async (transactionId, adminId, decision, reason) => {
    assertId(transactionId, "transaction id");
    const before = await transaction_model_1.default.findById(transactionId).lean();
    if (!before)
        throw new error_1.NotFoundError("Transaction not found");
    const transaction = decision === "approve"
        ? await walletService.approveWithdrawal(transactionId)
        : await walletService.declineWithdrawal(transactionId);
    await admin_action_model_1.default.create({
        adminId, targetUserId: transaction.userId, targetType: "transaction", targetId: transaction._id,
        action: `withdrawal.${decision}d`, reason,
        previousState: { status: before.status, adminApproval: before.adminApproval },
        newState: { status: transaction.status, adminApproval: transaction.adminApproval, transferCode: transaction.transferCode },
    });
    return (0, exports.fetchAdminPayment)(transactionId);
};
exports.processAdminWithdrawal = processAdminWithdrawal;
