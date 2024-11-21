import Joi from "joi";
import { Request, Response, NextFunction } from "express";

export const validateProduct = (req: Request, res: Response, next: NextFunction) => {
  const productValidation = Joi.object({
    name: Joi.string().required().messages({
      "string.base": "Product name must be a string",
      "string.empty": "Product name is required",
    }),
    category: Joi.string().optional().messages({
      "array.base": "Category must be a string",
    }),
    subCategory: Joi.string().optional().messages({
        "array.base": "Sub Category must be a string",
      }),
    brand: Joi.string().optional().messages({
      "array.base": "Brand must be a of string",
    }),
    description: Joi.string().optional().messages({
      "string.base": "Description must be a string",
    }),
    availableQuantity: Joi.number().required().messages({
      "number.base": "Available quantity must be a number",
      "number.empty": "Available quantity is required",
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
  });

  const { error } = productValidation.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
   res.status(400).json({ errors: errorMessages });
   return ;
  }

  next();
};
export const validateUpdateProduct = (req: Request, res: Response, next: NextFunction) => {
    const updateProductValidation = Joi.object({
      name: Joi.string().optional().messages({
        "string.base": "Product name must be a string",
      }),
      category: Joi.string().optional().messages({
        "array.base": "Category must be a string",
      }),
      subCategory: Joi.string().optional().messages({
        "array.base": "Sub Category must be a string",
      }),
      brand: Joi.string().optional().messages({
        "array.base": "Brand must be a string",
      }),
      description: Joi.string().optional().messages({
        "string.base": "Description must be a string",
      }),
      availableQuantity: Joi.number().optional().messages({
        "number.base": "Available quantity must be a number",
      }),
      price: Joi.number().optional().messages({
        "number.base": "Price must be a number",
      }),
      storeName: Joi.string().optional().messages({
        "string.base": "Store name must be a string",
      }),
      location: Joi.string().optional().messages({
        "string.base": "Location must be a string",
      }),
      currency: Joi.string().optional().messages({
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

  export const validateReviewProduct = (req: Request, res: Response, next: NextFunction) => {
    const productReviewValidation = Joi.object({
      productId: Joi.string().required().messages({
        "string.base": "Product ID must be a string",
        "string.empty": "Product ID is required",
      }),
      rating: Joi.number().required().messages({
        "number.base": "Rating must be a number",
        "number.empty": "Rating is required",

      }),
      comment: Joi.string().required().messages({
        "string.base": "Comment must be a string",
        "string.empty": "Comment is required",
      }),
    });
  
    const { error } = productReviewValidation.validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return ;
    }
  
    next();
  };