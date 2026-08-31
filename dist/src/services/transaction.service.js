"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markTransactionFailedByReference = exports.markTransactionCompletedByReference = exports.fetchTransactionsForStatement = exports.fetchUserTransactionById = exports.fetchTransactionSummary = exports.fetchUserTransactionsFiltered = exports.fetchPriceForVerification = exports.fetchSingleTransactionByMilestoneId = exports.getVat = exports.changeVatServiceAdmin = exports.fetchTransactionAdmin = exports.fetchAllTransactionsAdmin = exports.fetchUserEarnings = exports.fetchTransactionsByService = exports.fetchAllUserEarningsAdmin = exports.fetchTransactionChartAdminDashboard = exports.totalAmountByTransaction = exports.totalCompletedJobsByTransaction = exports.fetchAllTransactionsByUser = exports.adminFetchAllTransactionsByStatus = exports.fetchTransactionByReference = exports.fetchUserTransactions = exports.fetchSingleTransaction = exports.fetchSingleTransactionWithDetails = exports.createTransaction = void 0;
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
const adminFetchAllTransactionsByStatus = async (status, page, limit, serviceType) => {
    const skip = (page - 1) * limit;
    const query = { status };
    if (serviceType)
        query.serviceType = serviceType;
    const totalTransactions = await transaction_model_1.default.countDocuments(query);
    const transactions = await transaction_model_1.default.find(query)
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
// Maps the API's status vocabulary (all|pending|failed|successful) onto the
// model's TransactionEnum values (pending/processing/completed/declined/failed)
const statusCondition = (status) => {
    if (!status || status === "all")
        return null;
    if (status === "successful")
        return { status: transaction_enum_1.TransactionEnum.completed };
    if (status === "failed")
        return { status: { $in: [transaction_enum_1.TransactionEnum.failed, transaction_enum_1.TransactionEnum.declined] } };
    if (status === "pending")
        return { status: { $in: [transaction_enum_1.TransactionEnum.pending, transaction_enum_1.TransactionEnum.processing] } };
    return null;
};
const fetchUserTransactionsFiltered = async (userId, filters) => {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
    const skip = (page - 1) * limit;
    const andConditions = [{ $or: [{ userId: userId }, { recieverId: userId }] }];
    const statusCond = statusCondition(filters.status);
    if (statusCond)
        andConditions.push(statusCond);
    if (filters.type === "inflow")
        andConditions.push({ type: transaction_enum_1.TransactionType.CREDIT });
    if (filters.type === "outflow")
        andConditions.push({ type: transaction_enum_1.TransactionType.DEBIT });
    if (filters.paymentMethod)
        andConditions.push({ paymentMethod: filters.paymentMethod });
    // Search by transaction reference/id or counterparty (falls back to description)
    if (filters.search?.trim()) {
        const search = filters.search.trim();
        const regex = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
        const searchConditions = [{ reference: regex }, { description: regex }, { counterparty: regex }];
        if (/^[a-f\d]{24}$/i.test(search))
            searchConditions.push({ _id: new mongoose_1.default.Types.ObjectId(search) });
        andConditions.push({ $or: searchConditions });
    }
    const query = { $and: andConditions };
    const [transactions, totalTransactions] = await Promise.all([
        transaction_model_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        transaction_model_1.default.countDocuments(query),
    ]);
    return { transactions, totalTransactions, page, totalPages: Math.ceil(totalTransactions / limit) };
};
exports.fetchUserTransactionsFiltered = fetchUserTransactionsFiltered;
// Chart summary for a rolling window: monthly inflow/outflow totals, total
// transaction count and % change vs the previous equal-length period.
const RANGE_MONTHS = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 };
const fetchTransactionSummary = async (userId, range) => {
    const months = RANGE_MONTHS[range] || 3;
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const previousStart = new Date(now.getFullYear(), now.getMonth() - (2 * months - 1), 1);
    const previousEnd = new Date(currentStart.getFullYear(), currentStart.getMonth(), 0, 23, 59, 59, 999);
    const buildWindowTotals = async (start, end) => {
        const rows = await transaction_model_1.default.aggregate([
            { $match: { userId: new mongoose_1.default.Types.ObjectId(userId), createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]);
        const inflow = rows.find((row) => row._id === transaction_enum_1.TransactionType.CREDIT)?.total || 0;
        const outflow = rows.find((row) => row._id === transaction_enum_1.TransactionType.DEBIT)?.total || 0;
        const count = rows.reduce((sum, row) => sum + row.count, 0);
        return { inflow, outflow, count };
    };
    const monthlyRows = await transaction_model_1.default.aggregate([
        { $match: { userId: new mongoose_1.default.Types.ObjectId(userId), createdAt: { $gte: currentStart, $lte: now } } },
        {
            $group: {
                _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, type: "$type" },
                total: { $sum: "$amount" },
            },
        },
    ]);
    const monthly = [];
    for (let i = 0; i < months; i++) {
        const bucket = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
        const inflow = monthlyRows.find((row) => row._id.year === bucket.getFullYear() && row._id.month === bucket.getMonth() + 1 && row._id.type === transaction_enum_1.TransactionType.CREDIT)?.total || 0;
        const outflow = monthlyRows.find((row) => row._id.year === bucket.getFullYear() && row._id.month === bucket.getMonth() + 1 && row._id.type === transaction_enum_1.TransactionType.DEBIT)?.total || 0;
        monthly.push({
            month: `${bucket.toLocaleString("en-US", { month: "short" })} ${bucket.getFullYear()}`,
            inflow,
            outflow,
        });
    }
    const current = await buildWindowTotals(currentStart, now);
    const previous = await buildWindowTotals(previousStart, previousEnd);
    const currentVolume = current.inflow + current.outflow;
    const previousVolume = previous.inflow + previous.outflow;
    const percentageChange = previousVolume === 0
        ? (currentVolume > 0 ? 100 : 0)
        : Number((((currentVolume - previousVolume) / previousVolume) * 100).toFixed(2));
    return {
        range,
        totalTransactions: current.count,
        inflowTotal: current.inflow,
        outflowTotal: current.outflow,
        percentageChange,
        monthly,
    };
};
exports.fetchTransactionSummary = fetchTransactionSummary;
const fetchUserTransactionById = async (userId, transactionId) => {
    return await transaction_model_1.default.findOne({
        _id: transactionId,
        $or: [{ userId: userId }, { recieverId: userId }],
    }).populate("walletId", "currency balance");
};
exports.fetchUserTransactionById = fetchUserTransactionById;
const fetchTransactionsForStatement = async (userId, startDate, endDate, status) => {
    const andConditions = [{ $or: [{ userId: userId }, { recieverId: userId }] }];
    const createdAt = {};
    if (startDate)
        createdAt.$gte = startDate;
    if (endDate)
        createdAt.$lte = endDate;
    if (Object.keys(createdAt).length)
        andConditions.push({ createdAt });
    const statusCond = statusCondition(status);
    if (statusCond)
        andConditions.push(statusCond);
    return await transaction_model_1.default.find({ $and: andConditions }).sort({ createdAt: 1 }).lean();
};
exports.fetchTransactionsForStatement = fetchTransactionsForStatement;
// Webhook idempotency helpers: mark by reference without saving so the caller
// decides (and can guard) before persisting.
const markTransactionCompletedByReference = async (reference) => {
    if (!reference)
        return null;
    const transaction = await transaction_model_1.default.findOne({ reference });
    if (!transaction)
        return null;
    if (transaction.status === transaction_enum_1.TransactionEnum.completed)
        return { transaction, alreadyProcessed: true };
    transaction.status = transaction_enum_1.TransactionEnum.completed;
    transaction.dateCompleted = new Date();
    return { transaction, alreadyProcessed: false };
};
exports.markTransactionCompletedByReference = markTransactionCompletedByReference;
const markTransactionFailedByReference = async (reference) => {
    if (!reference)
        return null;
    const transaction = await transaction_model_1.default.findOne({ reference });
    if (!transaction)
        return null;
    if (transaction.status === transaction_enum_1.TransactionEnum.failed)
        return { transaction, alreadyProcessed: true };
    transaction.status = transaction_enum_1.TransactionEnum.failed;
    transaction.dateCompleted = new Date();
    return { transaction, alreadyProcessed: false };
};
exports.markTransactionFailedByReference = markTransactionFailedByReference;
