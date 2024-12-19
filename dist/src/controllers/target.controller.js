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
exports.createTargetController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const targetService = __importStar(require("../services/target.service"));
exports.createTargetController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const targetData = req.body;
    const userId = req.user._id;
    targetData.userId = userId;
    const data = yield targetService.createTarget(targetData);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
// export const fetchDynamicTargetMetrics = catchAsync(async (req: JwtPayload, res: Response) => {
//   try {
//     const userId = req.user._id;
//     const target = await targetService.findUserTarget(userId );
//     if (!target) {
//         throw new NotFoundError("No target set!");
//     }
//     const targetGoals = {
//         jobs: target.job || 0,
//         amount: target.amount || 0,
//         referrals: target.referrals || 0,
//         invites: target.invites || 0,
//       };
//     // 1. Calculate Completed Jobs
//     const completedJobs = await Transaction.countDocuments({
//       userId,
//       jobId: { $exists: true },
//       status: TransactionEnum.completed,
//     });
//     // 2. Calculate Total Amount
//     const totalAmount = await Transaction.aggregate([
//       { $match: { userId, status: TransactionEnum.completed } },
//       { $group: { _id: null, total: { $sum: "$amount" } } },
//     ]);
//     const currentAmount = totalAmount.length > 0 ? totalAmount[0].total : 0;
//     // 3. Count Referrals
//     const totalReferrals = await Transaction.countDocuments({
//       userId,
//       serviceType: ServiceEnum.Referral,
//       status: TransactionEnum.completed,
//     });
//     // 4. Count Invites
//     const totalInvites = await Transaction.countDocuments({
//       userId,
//       serviceType: ServiceEnum.Invite,
//       status: TransactionEnum.completed,
//     });
//     // Calculate percentages dynamically
//     const jobPercentage = calculatePercentage(completedJobs, targetGoals.jobs);
//     const amountPercentage = calculatePercentage(currentAmount, targetGoals.amount);
//     const referralPercentage = calculatePercentage(totalReferrals, targetGoals.referrals);
//     const invitePercentage = calculatePercentage(totalInvites, targetGoals.invites);
//     // Calculate overall percentage (average of all metrics)
//     const totalTargetPercentage = Math.floor(
//       (jobPercentage + amountPercentage + referralPercentage + invitePercentage) / 4
//     );
//     // Response
//     return res.status(200).json({
//       success: true,
//       data: {
//         jobs: { current: completedJobs, target: targetGoals.jobs, percentage: jobPercentage },
//         amount: { current: currentAmount, target: targetGoals.amount, percentage: amountPercentage },
//         referrals: { current: totalReferrals, target: targetGoals.referrals, percentage: referralPercentage },
//         invites: { current: totalInvites, target: targetGoals.invites, percentage: invitePercentage },
//         totalTargetPercentage,
//       },
//     });
//   } catch (error) {
//     console.error("Error calculating dynamic target metrics:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });
