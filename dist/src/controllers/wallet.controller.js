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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSingleTransactionController = exports.verifyPaystackCardWalletFunding = exports.verifyBankTransferWalletFunding = exports.initiateWalletFunding = exports.createWalletController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const walletService = __importStar(require("../services/wallet.services"));
const error_1 = require("../errors/error");
const transactionService = __importStar(require("../services/transaction.service"));
const paystack_1 = require("../utils/paystack");
const transaction_enum_1 = require("../enums/transaction.enum");
exports.createWalletController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { currency, isDefault } = req.body;
    const data = yield walletService.createNewWallet(userId, currency, isDefault);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.initiateWalletFunding = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { currency, amount, paymentMethod, walletId } = req.body;
    const wallet = yield walletService.findWallet(userId, currency, walletId);
    if (!wallet)
        throw new error_1.NotFoundError('Wallet not found');
    const transactionPayload = {
        userId,
        type: transaction_enum_1.TransactionType.CREDIT,
        amount,
        description: `Wallet funding via ${paymentMethod}`,
        paymentMethod: paymentMethod,
        reference: paymentMethod === transaction_enum_1.PaymentMethodEnum.card ? `PS-${Date.now()}` : `BT-${Date.now()}`,
        recieverId: userId,
        balanceBefore: wallet.balance,
        walletId,
        currency,
    };
    const transaction = yield transactionService.createTransaction(transactionPayload);
    if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card && currency === transaction_enum_1.WalletEnum.NGN) {
        transaction.paymentService = transaction_enum_1.PaymentServiceEnum.paystack;
        const paymentLink = yield (0, paystack_1.generatePaystackPaymentLink)(transaction.reference, amount, req.user.email);
        const data = { paymentLink, transaction };
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    else {
        if (req.file) {
            transaction.transferReceipt = req.file.path;
        }
        ;
        yield transaction.save();
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, "Wallet funding initiated successfully");
    }
}));
exports.verifyBankTransferWalletFunding = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { transactionId, status } = req.body;
    let message;
    const transaction = yield transactionService.fetchSingleTransaction(transactionId);
    if (!transaction || transaction.paymentMethod !== transaction_enum_1.PaymentMethodEnum.bankTransfer) {
        throw new Error('Transaction not found or not a bank transfer');
    }
    const wallet = yield walletService.findWallet(String(transaction.userId), transaction.currency, transaction.walletId);
    if (!wallet) {
        throw new error_1.NotFoundError("Wallet not found!");
    }
    ;
    if (transaction.status === transaction_enum_1.TransactionEnum.completed) {
        throw new Error('Transaction is already completed');
    }
    transaction.adminApproval = true;
    if (status === "Approved") {
        transaction.status = transaction_enum_1.TransactionEnum.completed;
        transaction.adminApproval = true;
        transaction.balanceAfter = wallet.balance + transaction.amount;
        yield Promise.all([transaction.save(), walletService.fundWallet(String(transaction.walletId), transaction.amount)]);
    }
    else if (status === "Declined") {
        transaction.status = transaction_enum_1.TransactionEnum.declined;
        yield transaction.save();
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, message);
}));
exports.verifyPaystackCardWalletFunding = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reference } = req.params;
    const transaction = yield transactionService.fetchTransactionByReference(reference);
    if (!transaction) {
        throw new error_1.NotFoundError("Transaction not found!");
    }
    ;
    const wallet = yield walletService.findWallet(String(transaction.userId), transaction.currency, transaction.walletId);
    if (!wallet) {
        throw new error_1.NotFoundError("Wallet not found!");
    }
    ;
    let message;
    const verifyPayment = yield (0, paystack_1.verifyPaystackPayment)(reference);
    if (verifyPayment == "success") {
        transaction.status = transaction_enum_1.TransactionEnum.completed;
        transaction.balanceAfter = wallet.balance + transaction.amount;
        yield Promise.all([transaction.save(), walletService.fundWallet(String(transaction.walletId), transaction.amount)]);
        message = "Wallet funded successfully";
    }
    else {
        transaction.status = transaction_enum_1.TransactionEnum.failed;
        message = "Wallet funding failed";
        yield transaction.save();
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, message);
}));
exports.fetchSingleTransactionController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { transactionId } = req.params;
    const data = yield transactionService.fetchSingleTransactionWithDetails(transactionId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
