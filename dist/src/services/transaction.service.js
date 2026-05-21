"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPriceForVerification = exports.fetchSingleTransactionByMilestoneId = exports.getVat = exports.changeVatServiceAdmin = exports.fetchTransactionAdmin = exports.fetchAllTransactionsAdmin = exports.fetchUserEarnings = exports.fetchTransactionsByService = exports.fetchAllUserEarningsAdmin = exports.fetchTransactionChartAdminDashboard = exports.totalAmountByTransaction = exports.totalCompletedJobsByTransaction = exports.fetchAllTransactionsByUser = exports.adminFetchAllTransactionsByStatus = exports.fetchTransactionByReference = exports.fetchUserTransactions = exports.fetchSingleTransaction = exports.fetchSingleTransactionWithDetails = exports.createTransaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const transaction_enum_1 = require("../enums/transaction.enum");
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const app_config_model_1 = __importDefault(require("../models/app-config.model"));
const createTransaction = async (data) => {
    return await transaction_model_1.default.create(data);
};
exports.createTransaction = createTransaction;
const fetchSingleTransactionWithDetails = async (transactionId) => {
    return await transaction_model_1.default.findById(transactionId).populate('walletId').populate('userId', 'fullName email userName profileImage level _id uniqueId');
};
exports.fetchSingleTransactionWithDetails = fetchSingleTransactionWithDetails;
const fetchSingleTransaction = async (transactionId) => {
    return await transaction_model_1.default.findById(transactionId);
};
exports.fetchSingleTransaction = fetchSingleTransaction;
const fetchUserTransactions = async (page, limit, userId) => {
    const skip = (page - 1) * limit;
    return await transaction_model_1.default.find({ userId: userId })
        .skip(skip)
        .limit(limit);
};
exports.fetchUserTransactions = fetchUserTransactions;
const fetchTransactionByReference = async (reference) => {
    return await transaction_model_1.default.findOne({ reference });
};
exports.fetchTransactionByReference = fetchTransactionByReference;
const adminFetchAllTransactionsByStatus = async (status, page, limit) => {
    const skip = (page - 1) * limit;
    const totalTransactions = await transaction_model_1.default.countDocuments({ status });
    const transactions = await transaction_model_1.default.find({ status })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'fullName email userName profileImage level _id uniqueId');
    return {
        transactions,
        totalTransactions,
        page,
    };
};
exports.adminFetchAllTransactionsByStatus = adminFetchAllTransactionsByStatus;
const fetchAllTransactionsByUser = async (userId, page, limit, paymentMethod) => {
    const skip = (page - 1) * limit;
    let queryPayload = {
        $or: [{ userId: userId }, { recieverId: userId }],
    };
    if (paymentMethod) {
        if (paymentMethod === transaction_enum_1.PaymentMethodEnum.wallet) {
            queryPayload = {
                $and: [
                    { $or: [{ userId: userId }, { recieverId: userId }] },
                    {
                        $or: [
                            { paymentMethod: transaction_enum_1.PaymentMethodEnum.wallet },
                            {
                                paymentMethod: transaction_enum_1.PaymentMethodEnum.card,
                                serviceType: transaction_enum_1.ServiceEnum.walletFunding,
                            },
                        ],
                    },
                ],
            };
        }
        else {
            queryPayload.paymentMethod = paymentMethod;
        }
    }
    ;
    const totalTransactions = await transaction_model_1.default.countDocuments(queryPayload);
    const transactions = await transaction_model_1.default.find(queryPayload)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'fullName email userName profileImage level _id uniqueId');
    return {
        transactions,
        totalTransactions,
        page,
    };
};
exports.fetchAllTransactionsByUser = fetchAllTransactionsByUser;
const totalCompletedJobsByTransaction = async (userId) => {
    return await transaction_model_1.default.countDocuments({
        userId,
        jobId: { $exists: true },
        status: transaction_enum_1.TransactionEnum.completed,
    });
};
exports.totalCompletedJobsByTransaction = totalCompletedJobsByTransaction;
const totalAmountByTransaction = async (userId) => {
    return await transaction_model_1.default.aggregate([
        { $match: { userId, status: transaction_enum_1.TransactionEnum.completed } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
};
exports.totalAmountByTransaction = totalAmountByTransaction;
const fetchTransactionChartAdminDashboard = async (year, currency) => {
    const filter = {};
    if (year) {
        if (isNaN(year) || year < 1970 || year > new Date().getFullYear()) {
            throw new Error("Invalid year provided");
        }
    }
    const targetYear = year || new Date().getFullYear();
    const startOfYear = new Date(`${targetYear}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${targetYear}-12-31T23:59:59.999Z`);
    filter.createdAt = {
        $gte: startOfYear,
        $lt: endOfYear,
    };
    if (currency) {
        filter.currency = currency;
    }
    try {
        const transactions = await transaction_model_1.default.find(filter).lean();
        const totalsByCurrency = {};
        const transactionsByMonth = {};
        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        Object.values(transaction_enum_1.WalletEnum).forEach(curr => {
            totalsByCurrency[curr] = 0;
        });
        transactions.forEach((transaction) => {
            const { amount, currency, createdAt } = transaction;
            if (!currency || !amount) {
                console.warn("Missing currency or amount for transaction", transaction);
                return;
            }
            const standardizedCurrency = currency.toUpperCase();
            const amountNumber = Number(amount);
            const date = new Date(createdAt);
            if (isNaN(date.getTime())) {
                console.warn("Invalid date in transaction", transaction);
                return;
            }
            const month = date.toLocaleString("default", { month: "short" });
            const period = `${month} ${date.getFullYear()}`;
            totalsByCurrency[standardizedCurrency] = (totalsByCurrency[standardizedCurrency] || 0) + amountNumber;
            if (!transactionsByMonth[period]) {
                transactionsByMonth[period] = {};
                Object.values(transaction_enum_1.WalletEnum).forEach(curr => {
                    transactionsByMonth[period][curr] = 0;
                });
            }
            transactionsByMonth[period][standardizedCurrency] =
                (transactionsByMonth[period][standardizedCurrency] || 0) + amountNumber;
        });
        const transactionsArray = months.map((month) => {
            const period = `${month} ${targetYear}`;
            const amounts = transactionsByMonth[period] || {};
            const result = { period };
            if (currency) {
                result[currency] = amounts[currency] || 0;
            }
            else {
                Object.values(transaction_enum_1.WalletEnum).forEach(curr => {
                    result[curr] = amounts[curr] || 0;
                });
            }
            return result;
        });
        return {
            totalsByCurrency,
            transactions: transactionsArray,
        };
    }
    catch (error) {
        console.error("Error fetching transactions:", error);
        throw new Error("Unable to fetch transactions");
    }
};
exports.fetchTransactionChartAdminDashboard = fetchTransactionChartAdminDashboard;
const fetchAllUserEarningsAdmin = async (userId) => {
    return await transaction_model_1.default.aggregate([
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
};
exports.fetchAllUserEarningsAdmin = fetchAllUserEarningsAdmin;
const fetchTransactionsByService = async (userId, serviceType) => {
    return await transaction_model_1.default.find({ userId, serviceType });
};
exports.fetchTransactionsByService = fetchTransactionsByService;
const fetchUserEarnings = async (userId, startDate, endDate) => {
    return await transaction_model_1.default.find({
        userId,
        dateCompleted: { $gte: startDate, $lte: endDate },
        status: transaction_enum_1.TransactionEnum.completed,
    });
};
exports.fetchUserEarnings = fetchUserEarnings;
const fetchAllTransactionsAdmin = async (limit, page, search) => {
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;
    const searchableFields = [
        'transactionId',
        'status',
        'type',
        'description',
        'currency',
    ];
    const searchQuery = search
        ? {
            $or: searchableFields.map((field) => ({
                [field]: { $regex: search, $options: 'i' }
            }))
        }
        : {};
    const [transactions, totalTransactions] = await Promise.all([
        transaction_model_1.default.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('jobId')
            .populate('recieverId', '_id fullName')
            .populate('milestoneId')
            .populate('walletId', '_id')
            .populate('orderId')
            .populate('planId')
            .populate('userId', '_id fullName')
            .lean(),
        transaction_model_1.default.countDocuments(searchQuery)
    ]);
    return {
        transactions,
        totalTransactions,
    };
};
exports.fetchAllTransactionsAdmin = fetchAllTransactionsAdmin;
const fetchTransactionAdmin = async (transactionId) => {
    const transaction = await transaction_model_1.default.findById(transactionId)
        .populate('jobId')
        .populate('recieverId', '_id fullName')
        .populate('milestoneId')
        .populate('walletId', '_id')
        .populate('orderId')
        .populate('planId')
        .populate('userId', '_id fullName');
    return transaction;
};
exports.fetchTransactionAdmin = fetchTransactionAdmin;
const changeVatServiceAdmin = async (vat) => {
    return await app_config_model_1.default.updateOne({}, { $set: { vat } });
};
exports.changeVatServiceAdmin = changeVatServiceAdmin;
const getVat = async () => {
    return await app_config_model_1.default.findOne();
};
exports.getVat = getVat;
const fetchSingleTransactionByMilestoneId = async (milestoneId) => {
    return await transaction_model_1.default.findOne({
        milestoneId: milestoneId,
        status: transaction_enum_1.TransactionEnum.processing
    });
};
exports.fetchSingleTransactionByMilestoneId = fetchSingleTransactionByMilestoneId;
const fetchPriceForVerification = async () => {
    return await app_config_model_1.default.findOne();
};
exports.fetchPriceForVerification = fetchPriceForVerification;
