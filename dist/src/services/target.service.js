"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserTarget = exports.createTarget = void 0;
const target_model_1 = __importDefault(require("../models/target.model"));
const createTarget = async (payload) => {
    return await target_model_1.default.create(payload);
};
exports.createTarget = createTarget;
const findUserTarget = async (userId) => {
    return await target_model_1.default.findOne({ userId: userId });
};
exports.findUserTarget = findUserTarget;
