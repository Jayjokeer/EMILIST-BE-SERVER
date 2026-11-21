import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const validateDashboardOverview = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    period: Joi.string().valid("week", "month", "year", "all").default("week"),
  });
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) {
    res.status(400).json({ errors: error.details.map((detail) => detail.message) });
    return;
  }
  req.query = value;
  next();
};
