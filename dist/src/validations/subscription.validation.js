"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSubscriptionPayment = void 0;
const joi_1 = __importDefault(require("joi"));
const transaction_enum_1 = require("../enums/transaction.enum");
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
            "any.only": "Payment Method must be one of: credit_card, debit_card, paypal, or bank_transfer",
            "string.empty": "Payment Method is required",
        }),
        currency: joi_1.default.string()
            .valid(...Object.values(transaction_enum_1.WalletEnum))
            .required()
            .messages({
            'string.base': 'Currency must be a string',
            'any.only': 'Currency must be one of the allowed values',
            'string.empty': 'Currency is required',
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
