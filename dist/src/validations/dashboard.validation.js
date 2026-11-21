"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDashboardOverview = void 0;
const joi_1 = __importDefault(require("joi"));
const validateDashboardOverview = (req, res, next) => {
    const schema = joi_1.default.object({
        period: joi_1.default.string().valid("week", "month", "year", "all").default("week"),
    });
    const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
        res.status(400).json({ errors: error.details.map((detail) => detail.message) });
        return;
    }
    req.query = value;
    next();
};
exports.validateDashboardOverview = validateDashboardOverview;
