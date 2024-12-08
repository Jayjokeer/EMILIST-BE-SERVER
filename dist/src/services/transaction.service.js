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
exports.adminFetchAllTransactions = exports.fetchUserTransactions = exports.fetchSingleTransaction = exports.createTransaction = void 0;
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const createTransaction = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield transaction_model_1.default.create(data);
});
exports.createTransaction = createTransaction;
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
const adminFetchAllTransactions = (page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    return yield transaction_model_1.default.find()
        .skip(skip)
        .limit(limit)
        .populate('userId', 'fullName email userName profileImage level _id uniqueId');
});
exports.adminFetchAllTransactions = adminFetchAllTransactions;
// export const approveBankTransfer = async (transactionId: string, adminId: string) => {
//     const transaction = await Transaction.findById(transactionId);
//     if (!transaction || transaction.paymentMethod !== 'BankTransfer') {
//       throw new Error('Transaction not found or not a bank transfer');
//     }
//     if (transaction.status === 'completed') {
//       throw new Error('Transaction is already completed');
//     }
//     transaction.status = 'completed';
//     transaction.adminApproval = true;
//     // Update wallet balance
//     const wallet = await Wallet.findOne({ userId: transaction.userId });
//     wallet!.balance += transaction.amount;
//     // Save changes
//     await Promise.all([transaction.save(), wallet!.save()]);
//     return transaction;
//   };
