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
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawFundsController = exports.addBankAccountController = exports.fetchBankAccountsController = exports.fetchBanksController = exports.fetchPaymentMethodsController = exports.setDefaultWalletController = exports.fetchWalletDetailController = exports.fetchWalletsController = exports.verifyBankTransferWalletFunding = exports.initiateWalletFunding = exports.createWalletController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const walletService = __importStar(require("../services/wallet.services"));
const error_1 = require("../errors/error");
const transactionService = __importStar(require("../services/transaction.service"));
const paystack_1 = require("../utils/paystack");
const bankAccountService = __importStar(require("../services/bank-account.service"));
const transaction_enum_1 = require("../enums/transaction.enum");
const userService = __importStar(require("../services/auth.service"));
exports.createWalletController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { currency, isDefault } = req.body;
    const data = await walletService.createNewWallet(userId, currency, isDefault);
    const user = await userService.findUserById(userId);
    user?.wallets?.push(data._id);
    await user?.save();
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.initiateWalletFunding = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { currency, amount, paymentMethod, walletId, redirectUrl } = req.body;
    const wallet = await walletService.findWallet(userId, currency, walletId);
    if (!wallet)
        throw new error_1.NotFoundError('Wallet not found');
    const transactionPayload = {
        userId,
        type: transaction_enum_1.TransactionType.CREDIT,
        amount,
        description: `Wallet funding via ${paymentMethod}`,
        paymentMethod: paymentMethod,
        reference: paymentMethod === transaction_enum_1.PaymentMethodEnum.card ? `PS-${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}` : `BT-${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        recieverId: userId,
        balanceBefore: wallet.balance,
        walletId,
        currency,
        serviceType: transaction_enum_1.ServiceEnum.walletFunding,
    };
    const transaction = await transactionService.createTransaction(transactionPayload);
    if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card && currency === transaction_enum_1.WalletEnum.NGN) {
        if (!redirectUrl) {
            throw new error_1.BadRequestError("redirectUrl is required for card payments");
        }
        transaction.paymentService = transaction_enum_1.PaymentServiceEnum.paystack;
        const paymentLink = await (0, paystack_1.generatePaystackPaymentLink)(transaction.reference, amount, req.user.email, redirectUrl);
        await transaction.save();
        const data = {
            authorizationUrl: paymentLink,
            reference: transaction.reference,
            transactionId: transaction._id,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
        };
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    else {
        if (req.file) {
            transaction.transferReceipt = req.file.path;
        }
        ;
        await transaction.save();
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, "Wallet funding initiated successfully");
    }
});
exports.verifyBankTransferWalletFunding = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { transactionId, status } = req.body;
    let message;
    const transaction = await transactionService.fetchSingleTransaction(transactionId);
    if (!transaction || transaction.paymentMethod !== transaction_enum_1.PaymentMethodEnum.bankTransfer) {
        throw new Error('Transaction not found or not a bank transfer');
    }
    const wallet = await walletService.findWallet(String(transaction.userId), transaction.currency, transaction.walletId);
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
        await Promise.all([transaction.save(), walletService.fundWallet(String(transaction.walletId), transaction.amount)]);
    }
    else if (status === "Declined") {
        transaction.status = transaction_enum_1.TransactionEnum.declined;
        await transaction.save();
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, message);
});
// === Wallet management ===
exports.fetchWalletsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const wallets = await walletService.fetchUserWallets(req.user._id);
    const data = {
        wallets: wallets.map((wallet) => ({
            walletId: wallet._id,
            balance: wallet.balance,
            currency: wallet.currency,
            isDefault: wallet.isDefault,
            createdAt: wallet.createdAt,
        })),
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchWalletDetailController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { wallet, bankAccount } = await walletService.fetchWalletDetail(req.user._id, req.params.walletId);
    const data = {
        walletId: wallet._id,
        balance: wallet.balance,
        currency: wallet.currency,
        isDefault: wallet.isDefault,
        createdAt: wallet.createdAt,
        bankAccount: bankAccount ? bankAccountService.serializeBankAccount(bankAccount) : null,
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.setDefaultWalletController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const wallet = await walletService.setDefaultWallet(req.user._id, req.params.walletId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        walletId: wallet._id,
        balance: wallet.balance,
        currency: wallet.currency,
        isDefault: wallet.isDefault,
    });
});
// === Funding helpers ===
exports.fetchPaymentMethodsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const data = {
        paymentMethods: [
            { id: transaction_enum_1.PaymentMethodEnum.card, name: "Card", description: "Pay with your card via Paystack" },
            { id: transaction_enum_1.PaymentMethodEnum.bankTransfer, name: "BankTransfer", description: "Fund via manual bank transfer with receipt" },
        ],
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
// Bank list (code + name) for the add-bank-account screen
exports.fetchBanksController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const banks = await (0, paystack_1.fetchBanks)("NGN");
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        banks: banks.map((bank) => ({ bankCode: bank.code, bankName: bank.name })),
    });
});
// === Payout bank accounts ===
exports.fetchBankAccountsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const accounts = await bankAccountService.fetchUserBankAccounts(req.user._id);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        bankAccounts: accounts.map((account) => bankAccountService.serializeBankAccount(account)),
    });
});
exports.addBankAccountController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { bankCode, accountNumber, currency } = req.body;
    const account = await bankAccountService.addBankAccount(req.user._id, bankCode, accountNumber, currency);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, bankAccountService.serializeBankAccount(account));
});
// === Withdrawals (admin approval required before payout) ===
exports.withdrawFundsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { amount, currency, bankAccountId } = req.body;
    const bankAccount = await bankAccountService.fetchBankAccountById(userId, bankAccountId);
    const { wallet, balanceBefore } = await walletService.debitWalletForWithdrawal(userId, currency, amount);
    try {
        const transaction = await transactionService.createTransaction({
            userId,
            type: transaction_enum_1.TransactionType.DEBIT,
            amount,
            description: `Withdrawal to ${bankAccount.bankName} ${bankAccount.accountNumber}`,
            counterparty: `${bankAccount.bankName} - ${bankAccount.accountName}`,
            paymentMethod: transaction_enum_1.PaymentMethodEnum.bankTransfer,
            reference: `WD-${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
            balanceBefore,
            balanceAfter: wallet.balance,
            walletId: wallet._id,
            bankAccountId: bankAccount._id,
            currency,
            serviceType: transaction_enum_1.ServiceEnum.withdrawal,
            status: transaction_enum_1.TransactionEnum.pending,
        });
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, {
            transactionId: transaction._id,
            reference: transaction.reference,
            amount: transaction.amount,
            currency: transaction.currency,
            status: transaction.status,
            balance: wallet.balance,
            counterparty: transaction.counterparty,
        });
    }
    catch (error) {
        // Release the hold if the transaction record fails to persist
        wallet.balance += amount;
        await wallet.save();
        throw error;
    }
});
