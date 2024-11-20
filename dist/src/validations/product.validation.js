"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateProduct = exports.validateProduct = void 0;
const joi_1 = __importDefault(require("joi"));
const validateProduct = (req, res, next) => {
    const productValidation = joi_1.default.object({
        name: joi_1.default.string().required().messages({
            "string.base": "Product name must be a string",
            "string.empty": "Product name is required",
        }),
        category: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "array.base": "Category must be an array of strings",
        }),
        subCategory: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "array.base": "Sub Category must be an array of strings",
        }),
        brand: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "array.base": "Brand must be an array of strings",
        }),
        description: joi_1.default.string().optional().messages({
            "string.base": "Description must be a string",
        }),
        availableQuantity: joi_1.default.string().required().messages({
            "string.base": "Available quantity must be a string",
            "string.empty": "Available quantity is required",
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
        category: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "array.base": "Category must be an array of strings",
        }),
        subCategory: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "array.base": "Sub Category must be an array of strings",
        }),
        brand: joi_1.default.array().items(joi_1.default.string()).optional().messages({
            "array.base": "Brand must be an array of strings",
        }),
        description: joi_1.default.string().optional().messages({
            "string.base": "Description must be a string",
        }),
        availableQuantity: joi_1.default.string().optional().messages({
            "string.base": "Available quantity must be a string",
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
