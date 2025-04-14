import Joi from "joi";
import { Request, Response, NextFunction } from "express";

export const validateRegisterUser = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      userName: Joi.string().required().messages({
        "string.base": "Username must be a string",
        "string.empty": "Username is required",
      }),
      email: Joi.string().email().required().messages({
        "string.base": "Email must be a string",
        "string.email": "Invalid email format",
        "string.empty": "Email is required",
      }),
      password: Joi.string().min(6).required().messages({
        "string.base": "Password must be a string",
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters",
      }),
    });
  
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
       res.status(400).json({ errors: errorMessages });
       return;
    }
  
    next();
  };

  export const validateLoginUser = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be a string",
        "string.email": "Invalid email format",
        "string.empty": "Email is required",
      }),
      password: Joi.string().required().messages({
        "string.base": "Password must be a string",
        "string.empty": "Password is required",
      }),
    });
  
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      res.status(400).json({ errors: errorMessages });
      return;
    }
  
    next();
  };
  export const validateVerifyEmail = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be a string",
        "string.email": "Invalid email format",
        "string.empty": "Email is required",
      }),
      otp: Joi.string().required().messages({
        "string.base": "OTP must be a string",
        "string.empty": "OTP is required",
      }),
    });
  
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
       res.status(400).json({ errors: errorMessages });
       return;
    }
  
    next();
  };
  export const validateForgetPassword = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be a string",
        "string.email": "Invalid email format",
        "string.empty": "Email is required",
      }),
    });
  
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      res.status(400).json({ errors: errorMessages });
      return;
    }
  
    next();
  };
  export const validateResetPassword = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      otp: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
    }).messages({
      "any.required": "{#label} is required",
      "string.email": "Invalid email format",
      "string.min": "Password must be at least 6 characters",
    });
  
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
       res.status(400).json({ errors: errorMessages });
       return;
    }
  
    next();
  };
  export const validateUpdateAccountDetails = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      password: Joi.string().required(),
      number: Joi.string().required(),
      holdersName: Joi.string().required(),
      bank: Joi.string().required(),
    }).messages({
      "any.required": "{#label} is required",
      "string.empty": "{#label} cannot be empty",
    });
  
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
       res.status(400).json({ errors: errorMessages });
       return;
    }
  
    next();
  };
  export const validateChangePassword = (req: Request, res: Response, next: NextFunction) => {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
    }).messages({
      "any.required": "{#label} is required",
      "string.min": "New password must be at least 6 characters",
    });
  
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
     res.status(400).json({ errors: errorMessages });
     return;
    }
  
    next();
  };
  