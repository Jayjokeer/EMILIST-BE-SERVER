"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllUserEarningsAdmin = exports.fetchTransactionChartAdminDashboard = exports.totalAmountByTransaction = exports.totalCompletedJobsByTransaction = exports.fetchAllTransactionsByUser = exports.adminFetchAllTransactionsByStatus = exports.fetchTransactionByReference = exports.fetchUserTransactions = exports.fetchSingleTransaction = exports.fetchSingleTransactionWithDetails = exports.createTransaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const transaction_enum_1 = require("../enums/transaction.enum");
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const createTransaction = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield transaction_model_1.default.create(data);
});
exports.createTransaction = createTransaction;
const fetchSingleTransactionWithDetails = (transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield transaction_model_1.default.findById(transactionId).populate('walletId').populate('userId', 'fullName email userName profileImage level _id uniqueId');
});
exports.fetchSingleTransactionWithDetails = fetchSingleTransactionWithDetails;
const fetchSingleTransaction = (transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield transaction_model_1.default.findById(transactionId);
});
exports.fetchSingleTransaction = fetchSingleTransaction;
const fetchUserTransactions = (page, limit, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    return yield transaction_model_1.default.find({ userId: userId })
        .skip(skip)
        .limit(limit);
});
exports.fetchUserTransactions = fetchUserTransactions;
const fetchTransactionByReference = (reference) => __awaiter(void 0, void 0, void 0, function* () {
    return yield transaction_model_1.default.findOne({ reference });
});
exports.fetchTransactionByReference = fetchTransactionByReference;
const adminFetchAllTransactionsByStatus = (status, page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const totalTransactions = yield transaction_model_1.default.countDocuments({ status });
    const transactions = yield transaction_model_1.default.find({ status })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'fullName email userName profileImage level _id uniqueId');
    return {
        transactions,
        totalTransactions,
        page,
    };
});
exports.adminFetchAllTransactionsByStatus = adminFetchAllTransactionsByStatus;
const fetchAllTransactionsByUser = (userId, page, limit, paymentMethod) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    let queryPayload = {
        userId: userId
    };
    if (paymentMethod) {
        if (paymentMethod === transaction_enum_1.PaymentMethodEnum.wallet) {
            queryPayload = {
                userId: userId,
                $or: [
                    { paymentMethod: transaction_enum_1.PaymentMethodEnum.wallet },
                    {
                        paymentMethod: transaction_enum_1.PaymentMethodEnum.card,
                        serviceType: transaction_enum_1.ServiceEnum.walletFunding,
                    },
                ],
            };
        }
        else {
            queryPayload.paymentMethod = paymentMethod;
        }
    }
    ;
    const totalTransactions = yield transaction_model_1.default.countDocuments(queryPayload);
    const transactions = yield transaction_model_1.default.find(queryPayload)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'fullName email userName profileImage level _id uniqueId');
    return {
        transactions,
        totalTransactions,
        page,
    };
});
exports.fetchAllTransactionsByUser = fetchAllTransactionsByUser;
const totalCompletedJobsByTransaction = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield transaction_model_1.default.countDocuments({
        userId,
        jobId: { $exists: true },
        status: transaction_enum_1.TransactionEnum.completed,
    });
});
exports.totalCompletedJobsByTransaction = totalCompletedJobsByTransaction;
const totalAmountByTransaction = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield transaction_model_1.default.aggregate([
        { $match: { userId, status: transaction_enum_1.TransactionEnum.completed } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
});
exports.totalAmountByTransaction = totalAmountByTransaction;
const fetchTransactionChartAdminDashboard = (year, currency) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const match = {};
    if (year) {
        match.dateCompleted = {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
        };
    }
    else {
        match.dateCompleted = { $ne: null };
    }
    if (currency) {
        match.currency = currency;
    }
    const aggregation = [
        { $match: match },
        {
            $group: {
                _id: {
                    month: { $month: '$dateCompleted' },
                    currency: '$currency',
                },
                totalTransactions: { $sum: '$amount' },
            },
        },
        {
            $group: {
                _id: '$_id.currency',
                transactionsByMonth: {
                    $push: {
                        month: '$_id.month',
                        totalTransactions: '$totalTransactions',
                    },
                },
            },
        },
        {
            $project: {
                currency: '$_id',
                _id: 0,
                transactionsByMonth: {
                    $arrayToObject: {
                        $map: {
                            input: '$transactionsByMonth',
                            as: 'item',
                            in: {
                                k: {
                                    $let: {
                                        vars: { months: [null, 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] },
                                        in: { $arrayElemAt: ['$$months', '$$item.month'] },
                                    },
                                },
                                v: '$$item.totalTransactions',
                            },
                        },
                    },
                },
            },
        },
    ];
    const result = yield transaction_model_1.default.aggregate(aggregation);
    if (currency) {
        return ((_a = result.find((item) => item.currency === currency)) === null || _a === void 0 ? void 0 : _a.transactionsByMonth) || {};
    }
    return result.reduce((acc, item) => {
        acc[item.currency] = item.transactionsByMonth;
        return acc;
    }, {});
});
exports.fetchTransactionChartAdminDashboard = fetchTransactionChartAdminDashboard;
const fetchAllUserEarningsAdmin = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield transaction_model_1.default.aggregate([
        {
            $match: {
                recieverId: new mongoose_1.default.Types.ObjectId(userId),
            },
        },
        {
            $group: {
                _id: '$currency',
                totalEarnings: { $sum: '$amount' },
            },
        },
        {
            $project: {
                _id: 0,
                currency: '$_id',
                totalEarnings: 1,
            },
        },
    ]);
});
exports.fetchAllUserEarningsAdmin = fetchAllUserEarningsAdmin;
