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
exports.payWithWallet = exports.setDefaultWallet = exports.createNewWallet = exports.fundWallet = exports.findWallet = exports.findUserWalletByCurrency = exports.findUserWallet = exports.findWalletById = exports.createWallet = void 0;
const transaction_enum_1 = require("../enums/transaction.enum");
const error_1 = require("../errors/error");
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
const transactionService = __importStar(require("../services/transaction.service"));
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
        throw new Error('Wallet not found');
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
