"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPrivateExpertById = exports.fetchAllPrivateExpertsAdminDashboard = exports.fetchCountPrivateExpertsAdminDashboard = exports.createPrivateExpert = void 0;
const private_expert_moodel_1 = __importDefault(require("../models/private-expert.moodel"));
const createPrivateExpert = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield private_expert_moodel_1.default.create(payload);
});
exports.createPrivateExpert = createPrivateExpert;
const fetchCountPrivateExpertsAdminDashboard = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield private_expert_moodel_1.default.countDocuments();
});
exports.fetchCountPrivateExpertsAdminDashboard = fetchCountPrivateExpertsAdminDashboard;
const fetchAllPrivateExpertsAdminDashboard = (page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    return yield private_expert_moodel_1.default.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
});
exports.fetchAllPrivateExpertsAdminDashboard = fetchAllPrivateExpertsAdminDashboard;
const fetchPrivateExpertById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield private_expert_moodel_1.default.findById(id);
});
exports.fetchPrivateExpertById = fetchPrivateExpertById;
