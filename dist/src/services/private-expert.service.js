"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPrivateExpertById = exports.fetchAllPrivateExpertsAdminDashboard = exports.fetchCountPrivateExpertsAdminDashboard = exports.createPrivateExpert = void 0;
const private_expert_moodel_1 = __importDefault(require("../models/private-expert.moodel"));
const createPrivateExpert = async (payload) => {
    return await private_expert_moodel_1.default.create(payload);
};
exports.createPrivateExpert = createPrivateExpert;
const fetchCountPrivateExpertsAdminDashboard = async () => {
    return await private_expert_moodel_1.default.countDocuments();
};
exports.fetchCountPrivateExpertsAdminDashboard = fetchCountPrivateExpertsAdminDashboard;
const fetchAllPrivateExpertsAdminDashboard = async (page, limit) => {
    const skip = (page - 1) * limit;
    return await private_expert_moodel_1.default.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};
exports.fetchAllPrivateExpertsAdminDashboard = fetchAllPrivateExpertsAdminDashboard;
const fetchPrivateExpertById = async (id) => {
    return await private_expert_moodel_1.default.findById(id);
};
exports.fetchPrivateExpertById = fetchPrivateExpertById;
