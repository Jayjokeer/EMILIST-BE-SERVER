import Joi from 'joi';
import mongoose from 'mongoose';
import { TargetEnum } from '../enums/target.enum';
import { WalletEnum } from '../enums/transaction.enum';
import { NextFunction, Request, Response } from "express";

export const validateTarget = (req: Request, res: Response, next: NextFunction) => {
  const targetValidationSchema = Joi.object({
    duration: Joi.string()
      .valid(...Object.values(TargetEnum))
      .required()
      .messages({
        'string.base': 'Duration must be a string',
        'any.only': 'Duration must be one of the allowed values',
        'string.empty': 'Duration is required',
      }),
    job: Joi.number()
      .optional()
      .default(0)
      .messages({
        'number.base': 'Job must be a number',
      }),
    invites: Joi.number()
      .optional()
      .default(0)
      .messages({
        'number.base': 'Invites must be a number',
      }),
    referrals: Joi.number()
      .optional()
      .default(0)
      .messages({
        'number.base': 'Referrals must be a number',
      }),
    amount: Joi.number()
      .optional()
      .default(0)
      .messages({
        'number.base': 'Amount must be a number',
      }),
    currency: Joi.string()
      .valid(...Object.values(WalletEnum))
      .optional()
      .messages({
        'string.base': 'Currency must be a string',
        'any.only': 'Currency must be one of the allowed values',
      }),
  });

  const { error } = targetValidationSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    res.status(400).json({ errors: errorMessages });
    return;
  }

  next();
};
