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
exports.declineWithdrawal = exports.approveWithdrawal = exports.refundFailedWithdrawalByReference = exports.debitWalletForWithdrawal = exports.fetchWalletDetail = exports.fetchUserWallets = exports.payWithWallet = exports.setDefaultWallet = exports.createNewWallet = exports.fundWallet = exports.findWallet = exports.findUserWalletByCurrency = exports.findUserWallet = exports.findWalletById = exports.createWallet = void 0;
const transaction_enum_1 = require("../enums/transaction.enum");
const error_1 = require("../errors/error");
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
const bank_account_model_1 = __importDefault(require("../models/bank-account.model"));
const transactionService = __importStar(require("../services/transaction.service"));
const paystack_1 = require("../utils/paystack");
const createWallet = async (data) => {
    return await wallet_model_1.default.create(data);
};
exports.createWallet = createWallet;
const findWalletById = async (walletId) => {
    return await wallet_model_1.default.findById(walletId);
};
exports.findWalletById = findWalletById;
const findUserWallet = async (userId) => {
    return await wallet_model_1.default.findOne({ userId: userId });
};
exports.findUserWallet = findUserWallet;
const findUserWalletByCurrency = async (userId, currency) => {
    return await wallet_model_1.default.findOne({ userId: userId, currency: currency });
};
exports.findUserWalletByCurrency = findUserWalletByCurrency;
const findWallet = async (userId, currency, walletId) => {
    return await wallet_model_1.default.findOne({ userId: userId, currency: currency, _id: walletId });
};
exports.findWallet = findWallet;
const fundWallet = async (walletId, amount) => {
    try {
        const wallet = await wallet_model_1.default.findById({ _id: walletId });
        if (!wallet)
            throw new Error('Wallet not found');
        wallet.balance += amount;
        await wallet.save();
        return wallet;
    }
    catch (error) {
        console.log(error);
    }
    ;
};
exports.fundWallet = fundWallet;
const createNewWallet = async (userId, currency, isDefault = false) => {
    const existingWallet = await wallet_model_1.default.findOne({ userId, currency });
    if (existingWallet)
        throw new error_1.BadRequestError(`Wallet for ${currency} already exists`);
    if (isDefault) {
        await wallet_model_1.default.updateMany({ userId }, { isDefault: false });
    }
    const wallet = await wallet_model_1.default.create({ userId, currency, isDefault });
    return wallet;
};
exports.createNewWallet = createNewWallet;
const setDefaultWallet = async (userId, walletId) => {
    const wallet = await wallet_model_1.default.findOne({ _id: walletId, userId });
    if (!wallet)
        throw new error_1.NotFoundError('Wallet not found');
    await wallet_model_1.default.updateMany({ userId }, { isDefault: false });
    wallet.isDefault = true;
    await wallet.save();
    return wallet;
};
exports.setDefaultWallet = setDefaultWallet;
const payWithWallet = async (userId, amount, currency, description, receiverId, productId, quantity, jobId) => {
    const wallet = await wallet_model_1.default.findOne({ userId, currency });
    if (!wallet)
        throw new Error(`No wallet found for currency: ${currency}`);
    if (wallet.balance < amount)
        throw new Error('Insufficient funds');
    wallet.balance -= amount;
    await wallet.save();
    const transactionPayload = {
        userId,
        type: transaction_enum_1.TransactionType.DEBIT,
        amount,
        description: `Payment using ${currency} wallet`,
        balanceAfter: wallet.balance,
        status: transaction_enum_1.TransactionEnum.pending,
        recieverId: receiverId,
        jobId,
        quantity,
        productId,
    };
    await transactionService.createTransaction(transactionPayload);
    return wallet;
};
exports.payWithWallet = payWithWallet;
const fetchUserWallets = async (userId) => {
    return await wallet_model_1.default.find({ userId }).sort({ isDefault: -1, createdAt: 1 });
};
exports.fetchUserWallets = fetchUserWallets;
const fetchWalletDetail = async (userId, walletId) => {
    const wallet = await wallet_model_1.default.findOne({ _id: walletId, userId });
    if (!wallet)
        throw new error_1.NotFoundError("Wallet not found");
    const bankAccount = await bank_account_model_1.default.findOne({ userId, isDefault: true }) || await bank_account_model_1.default.findOne({ userId }).sort({ createdAt: -1 });
    return { wallet, bankAccount };
};
exports.fetchWalletDetail = fetchWalletDetail;
// Withdrawals hold (debit) the funds immediately so they cannot be spent while
// the withdrawal awaits admin approval; declined/failed transfers refund it.
const debitWalletForWithdrawal = async (userId, currency, amount) => {
    const wallet = await wallet_model_1.default.findOne({ userId, currency });
    if (!wallet)
        throw new error_1.NotFoundError(`No wallet found for currency: ${currency}`);
    if (wallet.balance < amount)
        throw new error_1.BadRequestError("Insufficient wallet balance");
    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    await wallet.save();
    return { wallet, balanceBefore };
};
exports.debitWalletForWithdrawal = debitWalletForWithdrawal;
const refundTransactionToWallet = async (transaction) => {
    if (transaction.isRefunded)
        return;
    const wallet = await wallet_model_1.default.findById(transaction.walletId);
    if (!wallet)
        return;
    wallet.balance += transaction.amount;
    await wallet.save();
    transaction.isRefunded = true;
    transaction.balanceAfter = wallet.balance;
};
// transfer.failed / transfer.reversed webhook handler
const refundFailedWithdrawalByReference = async (reference) => {
    if (!reference)
        return;
    const transaction = await transactionService.fetchTransactionByReference(reference);
    if (!transaction)
        return;
    if (transaction.status === transaction_enum_1.TransactionEnum.failed)
        return; // already refunded/processed
    transaction.status = transaction_enum_1.TransactionEnum.failed;
    transaction.dateCompleted = new Date();
    await refundTransactionToWallet(transaction);
    await transaction.save();
};
exports.refundFailedWithdrawalByReference = refundFailedWithdrawalByReference;
// Admin approves a pending withdrawal -> Paystack transfer goes out
const approveWithdrawal = async (transactionId) => {
    const transaction = await transactionService.fetchSingleTransaction(transactionId);
    if (!transaction)
        throw new error_1.NotFoundError("Transaction not found");
    if (transaction.serviceType !== transaction_enum_1.ServiceEnum.withdrawal)
        throw new error_1.BadRequestError("This is not a withdrawal transaction");
    if (transaction.status !== transaction_enum_1.TransactionEnum.pending)
        throw new error_1.BadRequestError("Withdrawal has already been processed");
    const bankAccount = await bank_account_model_1.default.findById(transaction.bankAccountId);
    if (!bankAccount)
        throw new error_1.NotFoundError("Bank account not found for this withdrawal");
    transaction.adminApproval = true;
    transaction.status = transaction_enum_1.TransactionEnum.processing;
    try {
        const transfer = await (0, paystack_1.initiateTransfer)(transaction.amount, bankAccount.recipientCode, transaction.reference, transaction.description || undefined);
        transaction.transferCode = transfer.transfer_code;
    }
    catch (error) {
        transaction.status = transaction_enum_1.TransactionEnum.failed;
        await refundTransactionToWallet(transaction);
        await transaction.save();
        throw new error_1.BadRequestError(`Could not initiate Paystack transfer: ${error?.response?.data?.message || error.message}`);
    }
    await transaction.save();
    return transaction;
};
exports.approveWithdrawal = approveWithdrawal;
// Admin declines a pending withdrawal -> held amount is refunded
const declineWithdrawal = async (transactionId) => {
    const transaction = await transactionService.fetchSingleTransaction(transactionId);
    if (!transaction)
        throw new error_1.NotFoundError("Transaction not found");
    if (transaction.serviceType !== transaction_enum_1.ServiceEnum.withdrawal)
        throw new error_1.BadRequestError("This is not a withdrawal transaction");
    if (transaction.status !== transaction_enum_1.TransactionEnum.pending)
        throw new error_1.BadRequestError("Withdrawal has already been processed");
    transaction.adminApproval = true;
    transaction.status = transaction_enum_1.TransactionEnum.declined;
    await refundTransactionToWallet(transaction);
    await transaction.save();
    return transaction;
};
exports.declineWithdrawal = declineWithdrawal;
