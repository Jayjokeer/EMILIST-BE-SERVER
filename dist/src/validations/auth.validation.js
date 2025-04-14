"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChangePassword = exports.validateUpdateAccountDetails = exports.validateResetPassword = exports.validateForgetPassword = exports.validateVerifyEmail = exports.validateLoginUser = exports.validateRegisterUser = void 0;
const joi_1 = __importDefault(require("joi"));
const validateRegisterUser = (req, res, next) => {
    const schema = joi_1.default.object({
        userName: joi_1.default.string().required().messages({
            "string.base": "Username must be a string",
            "string.empty": "Username is required",
        }),
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
