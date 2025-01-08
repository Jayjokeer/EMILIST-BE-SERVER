"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAddUserAdmin = void 0;
const joi_1 = __importDefault(require("joi"));
const validateAddUserAdmin = (req, res, next) => {
    const adminaddUserValidation = joi_1.default.object({
        userName: joi_1.default.string().required().messages({
            "string.base": "username must be a string",
            "string.empty": "username is required",
        }),
        email: joi_1.default.string().required().messages({
            "string.base": "Email must be a string",
            "string.empty": "Email is required",
        }),
    });
    const { error } = adminaddUserValidation.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateAddUserAdmin = validateAddUserAdmin;
