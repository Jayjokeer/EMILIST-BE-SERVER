import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { PaymentMethodEnum, WalletEnum } from "../enums/transaction.enum";

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

  export const validatePayForProduct = (req: Request, res: Response, next: NextFunction) => {
    const paymentValidationSchema = Joi.object({
      cartId: Joi.string().required().messages({
        'string.base': 'Cart ID must be a string',
        'string.empty': 'Cart ID is required',
      }),
      paymentMethod: Joi.string()
        .valid(...Object.values(PaymentMethodEnum))
        .required()
        .messages({
          'string.base': 'Payment method must be a string',
          'any.only': 'Payment method must be one of the allowed values',
          'string.empty': 'Payment method is required',
        }),
      currency: Joi.string()
        .valid(...Object.values(WalletEnum))
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
  export const validatePaymentForJob = (req: Request, res: Response, next: NextFunction) => {
    const jobValidationSchema = Joi.object({
      jobId: Joi.string().required().messages({
        'string.base': 'Job ID must be a string',
        'string.empty': 'Job ID is required',
      }),
      milestoneId: Joi.string().required().messages({
        'string.base': 'Milestone ID must be a string',
        'string.empty': 'Milestone ID is required',
      }),
      note: Joi.string().optional().allow("").messages({
        'string.base': 'Note must be a string',
      }),
      paymentMethod: Joi.string()
        .valid(...Object.values(PaymentMethodEnum))
        .required()
        .messages({
          'string.base': 'Payment method must be a string',
          'any.only': 'Payment method must be one of the allowed values',
          'string.empty': 'Payment method is required',
        }),
      currency: Joi.string()
        .valid(...Object.values(WalletEnum))
        .required()
        .messages({
          'string.base': 'Currency must be a string',
          'any.only': 'Currency must be one of the allowed values',
          'string.empty': 'Currency is required',
        }),
    });
  
    const { error } = jobValidationSchema.validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
       res.status(400).json({ errors: errorMessages });
       return;
    }
  
    next();
  };

  export const addDiscountToProductValidator = (req: Request, res: Response, next: NextFunction) => {
    const addDiscountValidation = Joi.object({
      discount: Joi.number().required().messages({
        "number.base": "Discount must be a number",
        "number.empty": "Discount is required",
      }),
    });
  
    const { error } = addDiscountValidation .validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return ;
    }
  
    next();
  };
