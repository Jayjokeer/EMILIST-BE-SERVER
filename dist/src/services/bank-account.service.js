"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultBankAccount = exports.fetchBankAccountById = exports.fetchUserBankAccounts = exports.addBankAccount = exports.serializeBankAccount = void 0;
const bank_account_model_1 = __importDefault(require("../models/bank-account.model"));
const error_1 = require("../errors/error");
const paystack_1 = require("../utils/paystack");
const transaction_enum_1 = require("../enums/transaction.enum");
// Standard payout-account shape used across responses
const serializeBankAccount = (account) => ({
    bankAccountId: account._id,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    accountName: account.accountName,
    currency: account.currency,
    isDefault: account.isDefault,
});
exports.serializeBankAccount = serializeBankAccount;
const addBankAccount = async (userId, bankCode, accountNumber, currency = transaction_enum_1.WalletEnum.NGN) => {
    const duplicate = await bank_account_model_1.default.findOne({ userId, bankCode, accountNumber });
    if (duplicate)
        throw new error_1.BadRequestError("This bank account has already been added");
    // Resolve the account on Paystack so we store the verified account name
    const resolved = await (0, paystack_1.resolveBankAccount)(accountNumber, bankCode);
    const banks = await (0, paystack_1.fetchBanks)(currency);
    const bank = banks.find((b) => String(b.code) === String(bankCode));
    if (!bank)
        throw new error_1.BadRequestError("Unknown bank code");
    // Transfer recipient is created once and reused for every payout
    const recipientCode = await (0, paystack_1.createTransferRecipient)(resolved.accountName, accountNumber, bankCode, currency);
    const hasDefault = await bank_account_model_1.default.exists({ userId, isDefault: true });
    const account = await bank_account_model_1.default.create({
        userId,
        bankName: bank.name,
        bankCode,
        accountNumber,
        accountName: resolved.accountName,
        recipientCode,
        currency,
        isDefault: !hasDefault,
    });
    return account;
};
exports.addBankAccount = addBankAccount;
const fetchUserBankAccounts = async (userId) => {
    return await bank_account_model_1.default.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
};
exports.fetchUserBankAccounts = fetchUserBankAccounts;
const fetchBankAccountById = async (userId, bankAccountId) => {
    const account = await bank_account_model_1.default.findOne({ _id: bankAccountId, userId });
    if (!account)
        throw new error_1.NotFoundError("Bank account not found");
    return account;
};
exports.fetchBankAccountById = fetchBankAccountById;
const getDefaultBankAccount = async (userId) => {
    return (await bank_account_model_1.default.findOne({ userId, isDefault: true })) || (await bank_account_model_1.default.findOne({ userId }).sort({ createdAt: -1 }));
};
exports.getDefaultBankAccount = getDefaultBankAccount;
