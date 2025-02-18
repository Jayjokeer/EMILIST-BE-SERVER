import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { MilestonePaymentStatus } from "../enums/jobs.enum";


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
  export const validateJobPaymentAdmin = (req: Request, res: Response, next: NextFunction) => {
    const updateJobPaymentValidation = Joi.object({
      status: Joi.string()
      .valid(...Object.values(MilestonePaymentStatus)) 
      .required()
      .messages({
        'any.only': 'Invalid status , must be one of: ' + Object.values(MilestonePaymentStatus).join(', '),
        'any.required': 'Status is required',
      }),
      milestoneId: Joi.string().required().messages({
        "string.base": "Milestone Id must be a string",
        "string.empty": "Milestone Id is required",
      }),
    });
  
    const { error } = updateJobPaymentValidation .validate(req.body, { abortEarly: false });
  
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return ;
    }
  
    next();
  };
