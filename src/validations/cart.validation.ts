import Joi from "joi";
import { Request, Response, NextFunction } from "express";


export const validateAddToCart = (req: Request, res: Response, next: NextFunction) => {
    const productValidation = Joi.object({
      productId: Joi.string().required().messages({
        "string.base": "Product ID must be a string",
        "string.empty": "Product ID is required",
      }),
      quantity: Joi.number().required().messages({
        "number.base": "Quantity must be a string",
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