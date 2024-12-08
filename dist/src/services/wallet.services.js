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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.payWithWallet = exports.setDefaultWallet = exports.createNewWallet = exports.fundWallet = exports.findUserWalletByCurrency = exports.findUserWallet = exports.createWallet = void 0;
const transaction_enum_1 = require("../enums/transaction.enum");
const error_1 = require("../errors/error");
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
const transactionService = __importStar(require("../services/transaction.service"));
const createWallet = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield wallet_model_1.default.create(data);
});
exports.createWallet = createWallet;
const findUserWallet = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield wallet_model_1.default.findOne({ userId: userId });
});
exports.findUserWallet = findUserWallet;
const findUserWalletByCurrency = (userId, currency) => __awaiter(void 0, void 0, void 0, function* () {
    return yield wallet_model_1.default.findOne({ userId: userId, currency: currency });
});
exports.findUserWalletByCurrency = findUserWalletByCurrency;
const fundWallet = (walletId, amount, description) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.default.findById(walletId);
    if (!wallet)
        throw new Error('Wallet not found');
    wallet.balance += amount;
    yield wallet.save();
    const transactionPayloaad = {
        userId: wallet.userId,
        type: transaction_enum_1.TransactionType.CREDIT,
        amount,
        description: `Funded wallet in ${wallet.currency}`,
        balanceAfter: wallet.balance,
        status: transaction_enum_1.TransactionEnum.completed,
        recieverId: wallet.userId,
        dateCompleted: Date.now(),
    };
    yield transactionService.createTransaction(transactionPayloaad);
    return wallet;
});
exports.fundWallet = fundWallet;
const createNewWallet = (userId_1, currency_1, ...args_1) => __awaiter(void 0, [userId_1, currency_1, ...args_1], void 0, function* (userId, currency, isDefault = false) {
    const existingWallet = yield wallet_model_1.default.findOne({ userId, currency });
    if (existingWallet)
        throw new error_1.BadRequestError(`Wallet for ${currency} already exists`);
    if (isDefault) {
        yield wallet_model_1.default.updateMany({ userId }, { isDefault: false });
    }
    const wallet = yield wallet_model_1.default.create({ userId, currency, isDefault });
    return wallet;
});
exports.createNewWallet = createNewWallet;
const setDefaultWallet = (userId, walletId) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.default.findOne({ _id: walletId, userId });
    if (!wallet)
        throw new Error('Wallet not found');
    yield wallet_model_1.default.updateMany({ userId }, { isDefault: false });
    wallet.isDefault = true;
    yield wallet.save();
    return wallet;
});
exports.setDefaultWallet = setDefaultWallet;
const payWithWallet = (userId, amount, currency, description, receiverId, productId, quantity, jobId) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.default.findOne({ userId, currency });
    if (!wallet)
        throw new Error(`No wallet found for currency: ${currency}`);
    if (wallet.balance < amount)
        throw new Error('Insufficient funds');
    wallet.balance -= amount;
    yield wallet.save();
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
    yield transactionService.createTransaction(transactionPayload);
    return wallet;
});
exports.payWithWallet = payWithWallet;
