import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { PaymentMethodEnum, WalletEnum } from '../enums/transaction.enum';
import { TargetEnum } from '../enums/target.enum';

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
      "any.only": "Payment Method must be one of: credit_card, debit_card, paypal, or bank_transfer",
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