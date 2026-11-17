"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserTarget = exports.createTarget = void 0;
const target_model_1 = __importDefault(require("../models/target.model"));
const user_report_service_1 = require("./user-report.service");
const createTarget = async (payload) => {
    return (0, user_report_service_1.upsertUserTarget)(String(payload.userId), payload);
};
exports.createTarget = createTarget;
const findUserTarget = async (userId, query = {}) => {
    return await target_model_1.default.findOne({ userId: userId, ...query }).sort({ updatedAt: -1 });
};
exports.findUserTarget = findUserTarget;
