import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { OrderDeliveryStatus } from "../enums/order.enum";

export const validateListOrders = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sortBy: Joi.string().valid("latest", "oldest", "total_high_low", "total_low_high").optional(),
    status: Joi.string().valid(...Object.values(OrderDeliveryStatus)).optional(),
  });
  const { error } = schema.validate(req.query, { abortEarly: false });
  if (error) {
    res.status(400).json({ errors: error.details.map((d) => d.message) });
    return;
  }
  next();
};

export const validateBulkCancel = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    orderIds: Joi.array().items(Joi.string().required()).min(1).required(),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({ errors: error.details.map((d) => d.message) });
    return;
  }
  next();
};

export const validateRateMerchant = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    productId: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().optional().allow(""),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({ errors: error.details.map((d) => d.message) });
    return;
  }
  next();
};

export const validateReason = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    reason: Joi.string().optional().allow(""),
  });
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400).json({ errors: error.details.map((d) => d.message) });
    return;
  }
  next();
};