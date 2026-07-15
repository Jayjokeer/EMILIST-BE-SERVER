"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCheckout = exports.validateAddToCart = void 0;
const joi_1 = __importDefault(require("joi"));
const validateAddToCart = (req, res, next) => {
    const productValidation = joi_1.default.object({
        productId: joi_1.default.string().required().messages({
            "string.base": "Product ID must be a string",
            "string.empty": "Product ID is required",
        }),
        quantity: joi_1.default.number().integer().min(1).required().messages({
            "number.base": "Quantity must be a number",
            "number.empty": "Quantity is required",
        }),
    });
    const { error } = productValidation.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateAddToCart = validateAddToCart;
const validateCheckout = (req, res, next) => {
    const schema = joi_1.default.object({
        code: joi_1.default.string().trim().max(50).optional().allow(""),
        shippingAddress: joi_1.default.string().trim().max(500).optional().allow(""),
        orderNote: joi_1.default.string().trim().max(1000).optional().allow(""),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        res.status(400).json({ errors: error.details.map((detail) => detail.message) });
        return;
    }
    next();
};
exports.validateCheckout = validateCheckout;
