"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateUser = exports.validatePaymentForVerification = exports.validateChangePassword = exports.validateUpdateAccountDetails = exports.validateResetPassword = exports.validateForgetPassword = exports.validateVerifyEmail = exports.validateLoginUser = exports.validateRegisterUser = void 0;
const joi_1 = __importDefault(require("joi"));
const transaction_enum_1 = require("../enums/transaction.enum");
const validateRegisterUser = (req, res, next) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string().email().required().messages({
            "string.base": "Email must be a string",
            "string.email": "Invalid email format",
            "string.empty": "Email is required",
        }),
        password: joi_1.default.string().min(6).required().messages({
            "string.base": "Password must be a string",
            "string.empty": "Password is required",
            "string.min": "Password must be at least 6 characters",
        }),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateRegisterUser = validateRegisterUser;
const validateLoginUser = (req, res, next) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string().email().required().messages({
            "string.base": "Email must be a string",
            "string.email": "Invalid email format",
            "string.empty": "Email is required",
        }),
        password: joi_1.default.string().required().messages({
            "string.base": "Password must be a string",
            "string.empty": "Password is required",
        }),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateLoginUser = validateLoginUser;
const validateVerifyEmail = (req, res, next) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string().email().required().messages({
            "string.base": "Email must be a string",
            "string.email": "Invalid email format",
            "string.empty": "Email is required",
        }),
        otp: joi_1.default.string().required().messages({
            "string.base": "OTP must be a string",
            "string.empty": "OTP is required",
        }),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateVerifyEmail = validateVerifyEmail;
const validateForgetPassword = (req, res, next) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string().email().required().messages({
            "string.base": "Email must be a string",
            "string.email": "Invalid email format",
            "string.empty": "Email is required",
        }),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateForgetPassword = validateForgetPassword;
const validateResetPassword = (req, res, next) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string().email().required(),
        otp: joi_1.default.string().required(),
        newPassword: joi_1.default.string().min(6).required(),
    }).messages({
        "any.required": "{#label} is required",
        "string.email": "Invalid email format",
        "string.min": "Password must be at least 6 characters",
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateResetPassword = validateResetPassword;
const validateUpdateAccountDetails = (req, res, next) => {
    const schema = joi_1.default.object({
        password: joi_1.default.string().required(),
        number: joi_1.default.string().required(),
        holdersName: joi_1.default.string().required(),
        bank: joi_1.default.string().required(),
    }).messages({
        "any.required": "{#label} is required",
        "string.empty": "{#label} cannot be empty",
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateUpdateAccountDetails = validateUpdateAccountDetails;
const validateChangePassword = (req, res, next) => {
    const schema = joi_1.default.object({
        currentPassword: joi_1.default.string().required(),
        newPassword: joi_1.default.string().min(6).required(),
    }).messages({
        "any.required": "{#label} is required",
        "string.min": "New password must be at least 6 characters",
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateChangePassword = validateChangePassword;
const validatePaymentForVerification = (req, res, next) => {
    const schema = joi_1.default.object({
        verificationId: joi_1.default.string().required().messages({
            'string.base': 'verification ID must be a string',
            'string.empty': 'verification ID is required',
        }),
        paymentMethod: joi_1.default.string()
            .valid(...Object.values(transaction_enum_1.PaymentMethodEnum))
            .required()
            .messages({
            'string.base': 'Payment method must be a string',
            'any.only': 'Payment method must be one of the allowed values',
            'string.empty': 'Payment method is required',
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
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validatePaymentForVerification = validatePaymentForVerification;
const validateUpdateUser = (req, res, next) => {
    const schema = joi_1.default.object({
        firstName: joi_1.default.string().required().messages({
            "string.base": "First Name must be a string",
            "string.empty": "first Name is required",
        }),
        lastName: joi_1.default.string().required().messages({
            "string.base": "Last Name must be a string",
            "string.empty": "Last Name is required",
        }),
        gender: joi_1.default.string().required().messages({
            "string.base": "Gender must be a string",
            "string.empty": "Gender is required",
        }),
        countryCode: joi_1.default.string().required().messages({
            "string.base": "Country Code must be a string",
            "string.empty": "Country Code is required",
        }),
        language: joi_1.default.string().required().messages({
            "string.base": "Language must be a string",
            "string.empty": "Language is required",
        }),
        houseAddress: joi_1.default.string().required().messages({
            "string.base": "House Address must be a string",
            "string.empty": "House Address is required",
        }),
        mobile: joi_1.default.string().required().messages({
            "string.base": "Mobile must be a string",
            "string.empty": "Mobile is required",
        }),
        city: joi_1.default.string().required().messages({
            "string.base": "City must be a string",
            "string.empty": "City is required",
        }),
        state: joi_1.default.string().required().messages({
            "string.base": "State must be a string",
            "string.empty": "State is required",
        }),
        country: joi_1.default.string().required().messages({
            "string.base": "Country must be a string",
            "string.empty": "Country is required",
        }),
        bio: joi_1.default.string().required().messages({
            "string.base": "Bio must be a string",
            "string.empty": "Bio is required",
        }),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateUpdateUser = validateUpdateUser;
