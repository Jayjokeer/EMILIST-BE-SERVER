import Joi from "joi";
import { Request, Response, NextFunction } from "express";


export const validateAddUserAdmin = (req: Request, res: Response, next: NextFunction) => {
    const adminaddUserValidation = Joi.object({
      userName: Joi.string().required().messages({
        "string.base": "username must be a string",
        "string.empty": "username is required",
      }),
      email: Joi.string().required().messages({
        "string.base": "Email must be a string",
        "string.empty": "Email is required",
      }),
    });
  
    const { error } = adminaddUserValidation.validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return ;
    }
  
    next();
  };