import Joi from "joi";
import { Request, Response, NextFunction } from "express";


export const validateAddToCart = (req: Request, res: Response, next: NextFunction) => {
    const productValidation = Joi.object({
      productId: Joi.string().required().messages({
        "string.base": "Product ID must be a string",
        "string.empty": "Product ID is required",
      }),
      quantity: Joi.number().integer().min(1).required().messages({
        "number.base": "Quantity must be a number",
        "number.empty": "Quantity is required",
      }),
    });
  
    const { error } = productValidation.validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return ;
    }
  
  next();
  };

export const validateCheckout = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    code: Joi.string().trim().max(50).optional().allow(""),
    shippingAddress: Joi.string().trim().max(500).optional().allow(""),
    orderNote: Joi.string().trim().max(1000).optional().allow(""),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({ errors: error.details.map((detail) => detail.message) });
    return;
  }
  next();
};

export const validateApplyPromo = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    code: Joi.string().trim().min(3).max(20).required().messages({
      "string.base": "Promo code must be a string",
      "string.empty": "Promo code is required",
      "string.min": "Promo code must be at least 3 characters",
      "string.max": "Promo code must be at most 20 characters",
      "any.required": "Promo code is required",
    }),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({ errors: error.details.map((detail) => detail.message) });
    return;
  }
  next();
};
