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
exports.fetchAllTransactionsByUser = exports.adminFetchAllTransactionsByStatus = exports.fetchTransactionByReference = exports.fetchUserTransactions = exports.fetchSingleTransaction = exports.fetchSingleTransactionWithDetails = exports.createTransaction = void 0;
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
    const totalTransactions = yield transaction_model_1.default.countDocuments({ userId, paymentMethod });
    const transactions = yield transaction_model_1.default.find({ userId, paymentMethod })
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
