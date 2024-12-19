"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTarget = void 0;
const joi_1 = __importDefault(require("joi"));
const target_enum_1 = require("../enums/target.enum");
const transaction_enum_1 = require("../enums/transaction.enum");
const validateTarget = (req, res, next) => {
    const targetValidationSchema = joi_1.default.object({
        duration: joi_1.default.string()
            .valid(...Object.values(target_enum_1.TargetEnum))
            .required()
            .messages({
            'string.base': 'Duration must be a string',
            'any.only': 'Duration must be one of the allowed values',
            'string.empty': 'Duration is required',
        }),
        job: joi_1.default.number()
            .optional()
            .default(0)
            .messages({
            'number.base': 'Job must be a number',
        }),
        invites: joi_1.default.number()
            .optional()
            .default(0)
            .messages({
            'number.base': 'Invites must be a number',
        }),
        referrals: joi_1.default.number()
            .optional()
            .default(0)
            .messages({
            'number.base': 'Referrals must be a number',
        }),
        amount: joi_1.default.number()
            .optional()
            .default(0)
            .messages({
            'number.base': 'Amount must be a number',
        }),
        currency: joi_1.default.string()
            .valid(...Object.values(transaction_enum_1.WalletEnum))
            .optional()
            .messages({
            'string.base': 'Currency must be a string',
            'any.only': 'Currency must be one of the allowed values',
        }),
    });
    const { error } = targetValidationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateTarget = validateTarget;
