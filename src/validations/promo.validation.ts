import Joi from "joi";
import { Request, Response, NextFunction } from "express";

const objectId = Joi.string().hex().length(24).messages({
  "string.base": "Id must be a string",
  "string.hex": "Id must be a valid object id",
  "string.length": "Id must be a valid object id",
});

const promoCodeField = Joi.string().trim().uppercase().regex(/^[A-Z0-9]{3,20}$/).messages({
  "string.base": "Promo code must be a string",
  "string.empty": "Promo code cannot be empty",
  "string.pattern.base": "Promo code may only contain letters and numbers (3-20 characters)",
});

const productIdsField = Joi.array().items(objectId).min(1).max(50).unique().messages({
  "array.base": "productIds must be an array of product ids",
  "array.min": "At least one product is required",
  "array.max": "A promo code can target at most 50 products",
  "array.unique": "Duplicate product ids are not allowed",
});

const discountPercentageField = Joi.number().min(1).max(100).messages({
  "number.base": "Discount percentage must be a number",
  "number.min": "Discount percentage must be between 1 and 100",
  "number.max": "Discount percentage must be between 1 and 100",
});

const expiryDateField = Joi.date().greater("now").messages({
  "date.base": "Expiry date must be a valid date",
  "date.greater": "Expiry date must be in the future",
});

const respondValidationError = (res: Response, error: Joi.ValidationError) => {
  res.status(400).json({ errors: error.details.map((detail) => detail.message) });
};

// Seller creates a promo code scoped to specific product(s) in their inventory
export const validateCreatePromo = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    code: promoCodeField.optional(),
    productIds: productIdsField.required(),
    discountPercentage: discountPercentageField.required(),
    expiryDate: expiryDateField.required(),
    isSingleUse: Joi.boolean().optional(),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    respondValidationError(res, error);
    return;
  }
  next();
};

// Admin creates a promo code on behalf of a seller (seller must own the products)
export const validateAdminCreatePromo = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    sellerId: objectId.required(),
    code: promoCodeField.optional(),
    productIds: productIdsField.required(),
    discountPercentage: discountPercentageField.required(),
    expiryDate: expiryDateField.required(),
    isSingleUse: Joi.boolean().optional(),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    respondValidationError(res, error);
    return;
  }
  next();
};

export const validateUpdatePromo = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    code: Joi.forbidden().messages({ "any.unknown": "Promo code cannot be changed" }),
    productIds: productIdsField.optional(),
    discountPercentage: discountPercentageField.optional(),
    expiryDate: expiryDateField.optional(),
    isActive: Joi.boolean().optional(),
  }).min(1).messages({ "object.min": "Provide at least one field to update" });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    respondValidationError(res, error);
    return;
  }
  next();
};