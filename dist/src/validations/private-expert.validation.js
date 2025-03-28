"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExpert = void 0;
const joi_1 = __importDefault(require("joi"));
const validateExpert = (req, res, next) => {
    const expertValidationSchema = joi_1.default.object({
        fullName: joi_1.default.string()
            .required()
            .messages({
            'string.base': 'Full Name must be a string',
            'string.empty': 'Full Name is required',
        }),
        phoneNumber: joi_1.default.string()
            .required()
            .messages({
            'string.base': 'Phone number must be a string',
            'string.empty': 'Phone number is required',
        }),
        email: joi_1.default.string()
            .email()
            .required()
            .messages({
            'string.base': 'Email must be a string',
            'string.email': 'Email must be a valid email address',
            'string.empty': 'Email is required',
        }),
        typeOfExpert: joi_1.default.string()
            .optional()
            .messages({
            'string.base': 'Type of Expert must be a string',
        }),
        details: joi_1.default.string()
            .optional()
            .messages({
            'string.base': 'Details must be a string',
        }),
        location: joi_1.default.string().optional().messages({
            'string.base': 'Location must be a string',
        }),
        availability: joi_1.default.array()
            .items(joi_1.default.object({
            time: joi_1.default.string()
                .required()
                .messages({
                'string.base': 'Availability time must be a valid string',
                'string.empty': 'Availability time is required',
            }),
            date: joi_1.default.date()
                .required()
                .messages({
                'date.base': 'Availability date must be a valid date',
                'date.empty': 'Availability date is required',
            }),
        }))
            .optional()
            .messages({
            'array.base': 'Availability must be an array of time and date objects',
        }),
    });
    const { error } = expertValidationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateExpert = validateExpert;
