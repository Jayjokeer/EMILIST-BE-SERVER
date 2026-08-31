"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateStatementRequest = exports.validateTransactionSummary = exports.validateTransactionFilters = exports.validateWithdrawFunds = exports.validateAddBankAccount = exports.validateInitiateWalletFunding = exports.validateCreateWallet = void 0;
const joi_1 = __importDefault(require("joi"));
const transaction_enum_1 = require("../enums/transaction.enum");
const respondValidationError = (res, error) => {
    res.status(400).json({ errors: error.details.map((detail) => detail.message) });
};
const currencyField = joi_1.default.string()
    .valid(...Object.values(transaction_enum_1.WalletEnum))
    .required()
    .messages({
    "string.base": "Currency must be a string",
    "any.only": "Currency must be one of NGN, USD, GBP, EUR",
    "any.required": "Currency is required",
});
const validateCreateWallet = (req, res, next) => {
    const schema = joi_1.default.object({
        currency: currencyField,
        isDefault: joi_1.default.boolean().optional(),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error)
        return respondValidationError(res, error);
    next();
};
exports.validateCreateWallet = validateCreateWallet;
const validateInitiateWalletFunding = (req, res, next) => {
    const schema = joi_1.default.object({
        currency: currencyField,
        amount: joi_1.default.number().positive().required().messages({
            "number.base": "Amount must be a number",
            "number.positive": "Amount must be greater than 0",
            "any.required": "Amount is required",
        }),
        paymentMethod: joi_1.default.string()
            .valid(transaction_enum_1.PaymentMethodEnum.card, transaction_enum_1.PaymentMethodEnum.bankTransfer)
            .required()
            .messages({
            "any.only": "Payment method must be Card or BankTransfer",
            "any.required": "Payment method is required",
        }),
        walletId: joi_1.default.string().hex().length(24).optional(),
        redirectUrl: joi_1.default.string().uri().optional().messages({
            "string.uri": "redirectUrl must be a valid URL",
        }),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error)
        return respondValidationError(res, error);
    next();
};
exports.validateInitiateWalletFunding = validateInitiateWalletFunding;
const validateAddBankAccount = (req, res, next) => {
    const schema = joi_1.default.object({
        bankCode: joi_1.default.string().trim().required().messages({
            "string.base": "Bank code must be a string",
            "string.empty": "Bank code is required",
            "any.required": "Bank code is required",
        }),
        accountNumber: joi_1.default.string().trim().regex(/^\d{10}$/).required().messages({
            "string.pattern.base": "Account number must be 10 digits",
            "any.required": "Account number is required",
        }),
        currency: joi_1.default.string()
            .valid(...Object.values(transaction_enum_1.WalletEnum))
            .optional(),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error)
        return respondValidationError(res, error);
    next();
};
exports.validateAddBankAccount = validateAddBankAccount;
const validateWithdrawFunds = (req, res, next) => {
    const schema = joi_1.default.object({
        amount: joi_1.default.number().positive().min(1000).required().messages({
            "number.base": "Amount must be a number",
            "number.min": "Minimum withdrawal amount is 1000",
            "any.required": "Amount is required",
        }),
        currency: currencyField,
        bankAccountId: joi_1.default.string().hex().length(24).required().messages({
            "string.hex": "bankAccountId must be a valid id",
            "string.length": "bankAccountId must be a valid id",
            "any.required": "bankAccountId is required",
        }),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error)
        return respondValidationError(res, error);
    next();
};
exports.validateWithdrawFunds = validateWithdrawFunds;
const validateTransactionFilters = (req, res, next) => {
    const schema = joi_1.default.object({
        status: joi_1.default.string().valid("all", "pending", "failed", "successful").optional(),
        type: joi_1.default.string().valid("inflow", "outflow").optional(),
        search: joi_1.default.string().trim().max(100).optional(),
        paymentMethod: joi_1.default.string()
            .valid(...Object.values(transaction_enum_1.PaymentMethodEnum))
            .optional(),
        page: joi_1.default.number().integer().min(1).optional(),
        limit: joi_1.default.number().integer().min(1).max(100).optional(),
    });
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error)
        return respondValidationError(res, error);
    next();
};
exports.validateTransactionFilters = validateTransactionFilters;
const validateTransactionSummary = (req, res, next) => {
    const schema = joi_1.default.object({
        range: joi_1.default.string()
            .valid("1M", "3M", "6M", "1Y")
            .required()
            .messages({
            "any.only": "Range must be one of 1M, 3M, 6M, 1Y",
            "any.required": "Range is required",
        }),
    });
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error)
        return respondValidationError(res, error);
    next();
};
exports.validateTransactionSummary = validateTransactionSummary;
const validateStatementRequest = (req, res, next) => {
    const schema = joi_1.default.object({
        format: joi_1.default.string()
            .valid("pdf", "csv")
            .required()
            .messages({
            "any.only": "Format must be pdf or csv",
            "any.required": "Format is required",
        }),
        startDate: joi_1.default.date().iso().optional().messages({
            "date.format": "startDate must be an ISO date (e.g. 2026-01-31)",
        }),
        endDate: joi_1.default.date().iso().optional().messages({
            "date.format": "endDate must be an ISO date (e.g. 2026-01-31)",
        }),
        status: joi_1.default.string().valid("all", "pending", "failed", "successful").optional(),
    });
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error)
        return respondValidationError(res, error);
    next();
};
exports.validateStatementRequest = validateStatementRequest;
