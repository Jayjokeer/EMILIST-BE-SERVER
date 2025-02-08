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
exports.verifyBankTransferWalletFunding = exports.initiateWalletFunding = exports.createWalletController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const walletService = __importStar(require("../services/wallet.services"));
const error_1 = require("../errors/error");
const transactionService = __importStar(require("../services/transaction.service"));
const paystack_1 = require("../utils/paystack");
const transaction_enum_1 = require("../enums/transaction.enum");
const userService = __importStar(require("../services/auth.service"));
exports.createWalletController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.user._id;
    const { currency, isDefault } = req.body;
    const data = yield walletService.createNewWallet(userId, currency, isDefault);
    const user = yield userService.findUserById(userId);
    (_a = user === null || user === void 0 ? void 0 : user.wallets) === null || _a === void 0 ? void 0 : _a.push(data._id);
    yield (user === null || user === void 0 ? void 0 : user.save());
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
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
        serviceType: transaction_enum_1.ServiceEnum.walletFunding,
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
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, message);
}));
