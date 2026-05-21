"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlanByName = exports.getPlanById = exports.getPlans = exports.createPlan = void 0;
const plan_model_1 = __importDefault(require("../models/plan.model"));
const createPlan = async (data) => {
    return await plan_model_1.default.create(data);
};
exports.createPlan = createPlan;
const getPlans = async () => {
    return await plan_model_1.default.find({ isActive: true });
};
exports.getPlans = getPlans;
const getPlanById = async (planId) => {
    return await plan_model_1.default.findById(planId);
};
exports.getPlanById = getPlanById;
const getPlanByName = async (name) => {
    return await plan_model_1.default.findOne({ name });
};
exports.getPlanByName = getPlanByName;
