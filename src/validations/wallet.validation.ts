import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { PaymentMethodEnum, WalletEnum } from "../enums/transaction.enum";

const respondValidationError = (res: Response, error: Joi.ValidationError) => {
  res.status(400).json({ errors: error.details.map((detail) => detail.message) });
};

const currencyField = Joi.string()
  .valid(...Object.values(WalletEnum))
  .required()
  .messages({
    "string.base": "Currency must be a string",
    "any.only": "Currency must be one of NGN, USD, GBP, EUR",
    "any.required": "Currency is required",
  });

export const validateCreateWallet = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    currency: currencyField,
    isDefault: Joi.boolean().optional(),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return respondValidationError(res, error);
  next();
};

export const validateInitiateWalletFunding = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    currency: currencyField,
    amount: Joi.number().positive().required().messages({
      "number.base": "Amount must be a number",
      "number.positive": "Amount must be greater than 0",
      "any.required": "Amount is required",
    }),
    paymentMethod: Joi.string()
      .valid(PaymentMethodEnum.card, PaymentMethodEnum.bankTransfer)
      .required()
      .messages({
        "any.only": "Payment method must be Card or BankTransfer",
        "any.required": "Payment method is required",
      }),
    walletId: Joi.string().hex().length(24).optional(),
    redirectUrl: Joi.string().uri().optional().messages({
      "string.uri": "redirectUrl must be a valid URL",
    }),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return respondValidationError(res, error);
  next();
};

export const validateAddBankAccount = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    bankCode: Joi.string().trim().required().messages({
      "string.base": "Bank code must be a string",
      "string.empty": "Bank code is required",
      "any.required": "Bank code is required",
    }),
    accountNumber: Joi.string().trim().regex(/^\d{10}$/).required().messages({
      "string.pattern.base": "Account number must be 10 digits",
      "any.required": "Account number is required",
    }),
    currency: Joi.string()
      .valid(...Object.values(WalletEnum))
      .optional(),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return respondValidationError(res, error);
  next();
};

export const validateWithdrawFunds = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    amount: Joi.number().positive().min(1000).required().messages({
      "number.base": "Amount must be a number",
      "number.min": "Minimum withdrawal amount is 1000",
      "any.required": "Amount is required",
    }),
    currency: currencyField,
    bankAccountId: Joi.string().hex().length(24).required().messages({
      "string.hex": "bankAccountId must be a valid id",
      "string.length": "bankAccountId must be a valid id",
      "any.required": "bankAccountId is required",
    }),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return respondValidationError(res, error);
  next();
};

export const validateTransactionFilters = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    status: Joi.string().valid("all", "pending", "failed", "successful").optional(),
    type: Joi.string().valid("inflow", "outflow").optional(),
    search: Joi.string().trim().max(100).optional(),
    paymentMethod: Joi.string()
      .valid(...Object.values(PaymentMethodEnum))
      .optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  });
  const { error } = schema.validate(req.query, { abortEarly: false });
  if (error) return respondValidationError(res, error);
  next();
};

export const validateTransactionSummary = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    range: Joi.string()
      .valid("1M", "3M", "6M", "1Y")
      .required()
      .messages({
        "any.only": "Range must be one of 1M, 3M, 6M, 1Y",
        "any.required": "Range is required",
      }),
  });
  const { error } = schema.validate(req.query, { abortEarly: false });
  if (error) return respondValidationError(res, error);
  next();
};

export const validateStatementRequest = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    format: Joi.string()
      .valid("pdf", "csv")
      .required()
      .messages({
        "any.only": "Format must be pdf or csv",
        "any.required": "Format is required",
      }),
    startDate: Joi.date().iso().optional().messages({
      "date.format": "startDate must be an ISO date (e.g. 2026-01-31)",
    }),
    endDate: Joi.date().iso().optional().messages({
      "date.format": "endDate must be an ISO date (e.g. 2026-01-31)",
    }),
    status: Joi.string().valid("all", "pending", "failed", "successful").optional(),
  });
  const { error } = schema.validate(req.query, { abortEarly: false });
  if (error) return respondValidationError(res, error);
  next();
};