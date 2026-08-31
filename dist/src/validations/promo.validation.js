"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdatePromo = exports.validateAdminCreatePromo = exports.validateCreatePromo = void 0;
const joi_1 = __importDefault(require("joi"));
const objectId = joi_1.default.string().hex().length(24).messages({
    "string.base": "Id must be a string",
    "string.hex": "Id must be a valid object id",
    "string.length": "Id must be a valid object id",
});
const promoCodeField = joi_1.default.string().trim().uppercase().regex(/^[A-Z0-9]{3,20}$/).messages({
    "string.base": "Promo code must be a string",
    "string.empty": "Promo code cannot be empty",
    "string.pattern.base": "Promo code may only contain letters and numbers (3-20 characters)",
});
const productIdsField = joi_1.default.array().items(objectId).min(1).max(50).unique().messages({
    "array.base": "productIds must be an array of product ids",
    "array.min": "At least one product is required",
    "array.max": "A promo code can target at most 50 products",
    "array.unique": "Duplicate product ids are not allowed",
});
const discountPercentageField = joi_1.default.number().min(1).max(100).messages({
    "number.base": "Discount percentage must be a number",
    "number.min": "Discount percentage must be between 1 and 100",
    "number.max": "Discount percentage must be between 1 and 100",
});
const expiryDateField = joi_1.default.date().greater("now").messages({
    "date.base": "Expiry date must be a valid date",
    "date.greater": "Expiry date must be in the future",
});
const respondValidationError = (res, error) => {
    res.status(400).json({ errors: error.details.map((detail) => detail.message) });
};
// Seller creates a promo code scoped to specific product(s) in their inventory
const validateCreatePromo = (req, res, next) => {
    const schema = joi_1.default.object({
        code: promoCodeField.optional(),
        productIds: productIdsField.required(),
        discountPercentage: discountPercentageField.required(),
        expiryDate: expiryDateField.required(),
        isSingleUse: joi_1.default.boolean().optional(),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        respondValidationError(res, error);
        return;
    }
    next();
};
exports.validateCreatePromo = validateCreatePromo;
// Admin creates a promo code on behalf of a seller (seller must own the products)
const validateAdminCreatePromo = (req, res, next) => {
    const schema = joi_1.default.object({
        sellerId: objectId.required(),
        code: promoCodeField.optional(),
        productIds: productIdsField.required(),
        discountPercentage: discountPercentageField.required(),
        expiryDate: expiryDateField.required(),
        isSingleUse: joi_1.default.boolean().optional(),
    });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        respondValidationError(res, error);
        return;
    }
    next();
};
exports.validateAdminCreatePromo = validateAdminCreatePromo;
const validateUpdatePromo = (req, res, next) => {
    const schema = joi_1.default.object({
        code: joi_1.default.forbidden().messages({ "any.unknown": "Promo code cannot be changed" }),
        productIds: productIdsField.optional(),
        discountPercentage: discountPercentageField.optional(),
        expiryDate: expiryDateField.optional(),
        isActive: joi_1.default.boolean().optional(),
    }).min(1).messages({ "object.min": "Provide at least one field to update" });
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        respondValidationError(res, error);
        return;
    }
    next();
};
exports.validateUpdatePromo = validateUpdatePromo;
