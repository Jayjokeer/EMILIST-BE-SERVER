"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchDynamicTargetMetrics = exports.createTargetController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_1 = require("../errors/error");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const userService = __importStar(require("../services/auth.service"));
const targetService = __importStar(require("../services/target.service"));
const transactionService = __importStar(require("../services/transaction.service"));
const utility_1 = require("../utils/utility");
exports.createTargetController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const targetData = req.body;
    const userId = req.user._id;
    targetData.userId = userId;
    const data = yield targetService.createTarget(targetData);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.fetchDynamicTargetMetrics = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.user._id;
    const user = yield userService.findUserById(userId);
    const target = yield targetService.findUserTarget(userId);
    if (!target) {
        throw new error_1.NotFoundError("No target set!");
    }
    const targetGoals = {
        jobs: target.job || 0,
        amount: target.amount || 0,
        referrals: target.referrals || 0,
        invites: target.invites || 0,
    };
    const completedJobs = yield transactionService.totalCompletedJobsByTransaction(userId);
    const totalAmount = yield transactionService.totalAmountByTransaction(userId);
    const currentAmount = totalAmount.length > 0 ? totalAmount[0].total : 0;
    const totalReferrals = 0;
    const totalInvites = (_a = user === null || user === void 0 ? void 0 : user.invitedUsers) === null || _a === void 0 ? void 0 : _a.length;
    const jobPercentage = (0, utility_1.calculatePercentage)(completedJobs, targetGoals.jobs);
    const amountPercentage = (0, utility_1.calculatePercentage)(currentAmount, targetGoals.amount);
    const referralPercentage = (0, utility_1.calculatePercentage)(totalReferrals, targetGoals.referrals);
    const invitePercentage = (0, utility_1.calculatePercentage)(totalInvites, targetGoals.invites);
    const totalTargetPercentage = Math.floor((jobPercentage + amountPercentage + referralPercentage + invitePercentage) / 4);
    const data = {
        jobs: { current: completedJobs, target: targetGoals.jobs, percentage: jobPercentage },
        amount: { current: currentAmount, target: targetGoals.amount, percentage: amountPercentage },
        referrals: { current: totalReferrals, target: targetGoals.referrals, percentage: referralPercentage },
        invites: { current: totalInvites, target: targetGoals.invites, percentage: invitePercentage },
        totalTargetPercentage,
        currency: target.currency,
        duration: target.duration
    };
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
