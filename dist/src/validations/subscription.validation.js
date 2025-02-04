"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSubscriptionPayment = void 0;
const joi_1 = __importDefault(require("joi"));
const transaction_enum_1 = require("../enums/transaction.enum");
const target_enum_1 = require("../enums/target.enum");
const validateSubscriptionPayment = (req, res, next) => {
    const subscriptionPaymentValidation = joi_1.default.object({
        planId: joi_1.default.string().required().messages({
            "string.base": "Plan ID must be a string",
            "string.empty": "Plan ID is required",
        }),
        paymentMethod: joi_1.default.string()
            .valid(...Object.values(transaction_enum_1.PaymentMethodEnum))
            .required()
            .messages({
            "string.base": "Payment Method must be a string",
            "any.only": "Payment Method must be one of: Card, Wallet, or bankTransfer",
            "string.empty": "Payment Method is required",
        }),
        durationType: joi_1.default.string()
            .valid(...Object.values(target_enum_1.TargetEnum))
            .required()
            .messages({
            "string.base": "Duration must be a string",
            "any.only": "Duration must be one of: monthly or yearly",
            "string.empty": "Duration is required",
        }),
        currency: joi_1.default.string()
            .valid(...Object.values(transaction_enum_1.WalletEnum))
            .required()
            .messages({
            'string.base': 'Currency must be a string',
            'any.only': 'Currency must be one of the allowed values',
            'string.empty': 'Currency is required',
        }),
        isRenew: joi_1.default.boolean().required().messages({
            "boolean.base": "isRenew must be a boolean",
            "boolean.empty": "isRenew is required",
        }),
    });
    const { error } = subscriptionPaymentValidation.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateSubscriptionPayment = validateSubscriptionPayment;
