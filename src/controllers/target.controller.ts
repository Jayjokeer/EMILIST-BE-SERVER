import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { NotFoundError } from "../errors/error";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as userService from "../services/auth.service";
import * as targetService from "../services/target.service";
import { NextFunction, Request, Response } from "express";
import * as jobService from "../services/job.service";

export const createTargetController = catchAsync( async (req: JwtPayload, res: Response) => {
    const targetData = req.body;
    const userId = req.user._id;
    targetData.userId  = userId;

    const data = await targetService.createTarget(targetData);

   return successResponse(res,StatusCodes.CREATED, data);
});

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
