"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoteJobAndBusinessValidation = exports.validateSubscriptionPayment = void 0;
const joi_1 = __importDefault(require("joi"));
const transaction_enum_1 = require("../enums/transaction.enum");
const target_enum_1 = require("../enums/target.enum");
const suscribtion_enum_1 = require("../enums/suscribtion.enum");
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
const promoteJobAndBusinessValidation = (req, res, next) => {
    const promoteJobAndBusinessSchema = joi_1.default.object({
        target: joi_1.default.string()
            .valid(...Object.values(suscribtion_enum_1.PromotionTargetEnum))
            .required()
            .messages({
            'any.only': `Target must be one of: ${Object.values(suscribtion_enum_1.PromotionTargetEnum).join(', ')}`,
            'any.required': 'Target is required',
        }),
        startDate: joi_1.default.date()
            .iso()
            .required()
            .messages({
            'date.base': 'Start Date must be a valid date',
            'any.required': 'Start Date is required',
        }),
        endDate: joi_1.default.date()
            .iso()
            .required()
            .messages({
            'date.base': 'End Date must be a valid date',
            'any.required': 'End Date is required',
        }),
        type: joi_1.default.string()
            .valid('job', 'service')
            .required()
            .messages({
            'any.only': 'Type must be either "job" or "service"',
            'any.required': 'Type is required',
        }),
        expectedClicks: joi_1.default.number()
            .integer()
            .min(1)
            .required()
            .messages({
            'number.base': 'Expected clicks must be a number',
            'number.min': 'Expected clicks must be at least 1',
            'any.required': 'Expected clicks is required',
        }),
    });
    const { error } = promoteJobAndBusinessSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.promoteJobAndBusinessValidation = promoteJobAndBusinessValidation;
