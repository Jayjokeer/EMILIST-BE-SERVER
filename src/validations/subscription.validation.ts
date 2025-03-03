import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { PaymentMethodEnum, WalletEnum } from '../enums/transaction.enum';
import { TargetEnum } from '../enums/target.enum';
import { PromotionTargetEnum } from '../enums/suscribtion.enum';

export const validateSubscriptionPayment = (req: Request, res: Response, next: NextFunction) => {
  const subscriptionPaymentValidation = Joi.object({
    planId: Joi.string().required().messages({
      "string.base": "Plan ID must be a string",
      "string.empty": "Plan ID is required",
    }),
    paymentMethod: Joi.string()
    .valid(...Object.values(PaymentMethodEnum))
    .required()
    .messages({
      "string.base": "Payment Method must be a string",
      "any.only": "Payment Method must be one of: Card, Wallet, or bankTransfer",
      "string.empty": "Payment Method is required",
    }),
    durationType: Joi.string()
    .valid(...Object.values(TargetEnum))
    .required()
    .messages({
      "string.base": "Duration must be a string",
      "any.only": "Duration must be one of: monthly or yearly",
      "string.empty": "Duration is required",
    }),
    currency: Joi.string()
    .valid(...Object.values(WalletEnum))
    .required()
    .messages({
      'string.base': 'Currency must be a string',
      'any.only': 'Currency must be one of the allowed values',
      'string.empty': 'Currency is required',
    }),
    isRenew: Joi.boolean().required().messages({
        "boolean.base": "isRenew must be a boolean",
        "boolean.empty": "isRenew is required",
    }),
  });

  const { error } = subscriptionPaymentValidation.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    res.status(400).json({ errors: errorMessages });
    return;
  }
  next();
};

export const promoteJobAndBusinessValidation = (req: Request, res: Response, next: NextFunction) =>{
 const promoteJobAndBusinessSchema = Joi.object({
  target: Joi.string()
    .valid(...Object.values(PromotionTargetEnum))
    .required()
    .messages({
      'any.only': `Target must be one of: ${Object.values(PromotionTargetEnum).join(', ')}`,
      'any.required': 'Target is required',
    }),
  startDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Start Date must be a valid date',
      'any.required': 'Start Date is required',
    }),
  endDate: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'End Date must be a valid date',
      'any.required': 'End Date is required',
    }),
  type: Joi.string()
    .valid('job', 'service')
    .required()
    .messages({
      'any.only': 'Type must be either "job" or "service"',
      'any.required': 'Type is required',
    }),
  expectedClicks: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Expected clicks must be a number',
      'number.min': 'Expected clicks must be at least 1',
      'any.required': 'Expected clicks is required',
    }),
})
const { error } = promoteJobAndBusinessSchema.validate(req.body, { abortEarly: false });

if (error) {
  const errorMessages = error.details.map((detail) => detail.message);
  res.status(400).json({ errors: errorMessages });
  return;
}
next();
};
