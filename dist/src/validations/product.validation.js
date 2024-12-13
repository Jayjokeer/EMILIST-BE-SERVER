"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePayForProduct = exports.validateReviewProduct = exports.validateUpdateProduct = exports.validateProduct = void 0;
const joi_1 = __importDefault(require("joi"));
const transaction_enum_1 = require("../enums/transaction.enum");
const validateProduct = (req, res, next) => {
    const productValidation = joi_1.default.object({
        name: joi_1.default.string().required().messages({
            "string.base": "Product name must be a string",
            "string.empty": "Product name is required",
        }),
        category: joi_1.default.string().optional().messages({
            "array.base": "Category must be a string",
        }),
        subCategory: joi_1.default.string().optional().messages({
            "array.base": "Sub Category must be a string",
        }),
        brand: joi_1.default.string().optional().messages({
            "array.base": "Brand must be a of string",
        }),
        description: joi_1.default.string().optional().messages({
            "string.base": "Description must be a string",
        }),
        availableQuantity: joi_1.default.number().required().messages({
            "number.base": "Available quantity must be a number",
            "number.empty": "Available quantity is required",
        }),
        price: joi_1.default.number().required().messages({
            "number.base": "Price must be a number",
            "number.empty": "Price is required",
        }),
        storeName: joi_1.default.string().optional().messages({
            "string.base": "Store name must be a string",
        }),
        location: joi_1.default.string().required().messages({
            "string.base": "Location must be a string",
            "string.empty": "location is required",
        }),
        currency: joi_1.default.string().optional().messages({
            "string.base": "Currency must be a string",
            "string.empty": "Currency is required",
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
exports.validateProduct = validateProduct;
const validateUpdateProduct = (req, res, next) => {
    const updateProductValidation = joi_1.default.object({
        name: joi_1.default.string().optional().messages({
            "string.base": "Product name must be a string",
        }),
        category: joi_1.default.string().optional().messages({
            "array.base": "Category must be a string",
        }),
        subCategory: joi_1.default.string().optional().messages({
            "array.base": "Sub Category must be a string",
        }),
        brand: joi_1.default.string().optional().messages({
            "array.base": "Brand must be a string",
        }),
        description: joi_1.default.string().optional().messages({
            "string.base": "Description must be a string",
        }),
        availableQuantity: joi_1.default.number().optional().messages({
            "number.base": "Available quantity must be a number",
        }),
        price: joi_1.default.number().optional().messages({
            "number.base": "Price must be a number",
        }),
        storeName: joi_1.default.string().optional().messages({
            "string.base": "Store name must be a string",
        }),
        location: joi_1.default.string().optional().messages({
            "string.base": "Location must be a string",
        }),
        currency: joi_1.default.string().optional().messages({
            "string.base": "Currency must be a string",
        }),
    });
    const { error } = updateProductValidation.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateUpdateProduct = validateUpdateProduct;
const validateReviewProduct = (req, res, next) => {
    const productReviewValidation = joi_1.default.object({
        productId: joi_1.default.string().required().messages({
            "string.base": "Product ID must be a string",
            "string.empty": "Product ID is required",
        }),
        rating: joi_1.default.number().required().messages({
            "number.base": "Rating must be a number",
            "number.empty": "Rating is required",
        }),
        comment: joi_1.default.string().required().messages({
            "string.base": "Comment must be a string",
            "string.empty": "Comment is required",
        }),
    });
    const { error } = productReviewValidation.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validateReviewProduct = validateReviewProduct;
const validatePayForProduct = (req, res, next) => {
    const paymentValidationSchema = joi_1.default.object({
        cartId: joi_1.default.string().required().messages({
            'string.base': 'Cart ID must be a string',
            'string.empty': 'Cart ID is required',
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
    const { error } = paymentValidationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorMessages });
        return;
    }
    next();
};
exports.validatePayForProduct = validatePayForProduct;
