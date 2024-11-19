import Joi from "joi";
import { Request, Response, NextFunction } from "express";

export const validateProduct = (req: Request, res: Response, next: NextFunction) => {
  const productValidation = Joi.object({
    name: Joi.string().required().messages({
      "string.base": "Product name must be a string",
      "string.empty": "Product name is required",
    }),
    category: Joi.array().items(Joi.string()).optional().messages({
      "array.base": "Category must be an array of strings",
    }),
    brand: Joi.array().items(Joi.string()).optional().messages({
      "array.base": "Brand must be an array of strings",
    }),
    description: Joi.string().optional().messages({
      "string.base": "Description must be a string",
    }),
    availableQuantity: Joi.string().required().messages({
      "string.base": "Available quantity must be a string",
      "string.empty": "Available quantity is required",
    }),
    price: Joi.number().required().messages({
      "number.base": "Price must be a number",
      "number.empty": "Price is required",
    }),
    storeName: Joi.string().optional().messages({
      "string.base": "Store name must be a string",
    }),
    location: Joi.string().required().messages({
      "string.base": "Location must be a string",
      "string.empty": "location is required",

    }),
    currency: Joi.string().optional().messages({
      "string.base": "Currency must be a string",
      "string.empty": "Currency is required",

    }),
    orders: Joi.array().items(Joi.string()).optional().messages({
      "array.base": "Orders must be an array of strings",
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
