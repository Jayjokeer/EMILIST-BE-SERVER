import Joi from 'joi';
import { NextFunction, Request, Response } from "express";

export const validateExpert = (req: Request, res: Response, next: NextFunction) => {
  const expertValidationSchema = Joi.object({
    fullName: Joi.string()
      .required()
      .messages({
        'string.base': 'Full Name must be a string',
        'string.empty': 'Full Name is required',
      }),
    phoneNumber: Joi.string()
      .required()
      .messages({
        'string.base': 'Phone number must be a string',
        'string.empty': 'Phone number is required',
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.base': 'Email must be a string',
        'string.email': 'Email must be a valid email address',
        'string.empty': 'Email is required',
      }),
    typeOfExpert: Joi.string()
      .optional()
      .messages({
        'string.base': 'Type of Expert must be a string',
      }),
    details: Joi.string()
      .optional()
      .messages({
        'string.base': 'Details must be a string',
      }),
      location: Joi.string().optional().messages({
        'string.base': 'Location must be a string',
      }),
      availability: Joi.object({
        time: Joi.string().optional().messages({
          'string.base': 'Availability time must be a valid string',
        }),
        date: Joi.date().optional().messages({
          'date.base': 'Availability date must be a valid date',
        }),
    }).optional(),

  });

  const { error } = expertValidationSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    res.status(400).json({ errors: errorMessages });
    return;
  }

  next();
};
