import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { NotFoundError } from "../errors/error";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as userService from "../services/auth.service";
import * as targetService from "../services/target.service";
import { NextFunction, Request, Response } from "express";
import * as jobService from "../services/job.service";
import { ServiceEnum, TransactionEnum } from "../enums/transaction.enum";
import * as transactionService from "../services/transaction.service";
import { calculatePercentage } from "../utils/utility";

export const createTargetController = catchAsync( async (req: JwtPayload, res: Response) => {
    const targetData = req.body;
    const userId = req.user._id;
    targetData.userId  = userId;

    const data = await targetService.createTarget(targetData);

   return successResponse(res,StatusCodes.CREATED, data);
});

export const fetchDynamicTargetMetrics = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const user = await userService.findUserById(userId);
    const target = await targetService.findUserTarget(userId );

    if (!target) {
        throw new NotFoundError("No target set!");
    }

    const targetGoals = {
        jobs: target.job || 0,
        amount: target.amount || 0,
        referrals: target.referrals || 0,
        invites: target.invites || 0,
      };
    const completedJobs = await transactionService.totalCompletedJobsByTransaction(userId);

    const totalAmount = await transactionService.totalAmountByTransaction(userId);
    const currentAmount = totalAmount.length > 0 ? totalAmount[0].total : 0;

    const totalReferrals = 0;

    const totalInvites = user?.invitedUsers?.length as number;

    const jobPercentage = calculatePercentage(completedJobs, targetGoals.jobs);
    const amountPercentage = calculatePercentage(currentAmount, targetGoals.amount);
    const referralPercentage = calculatePercentage(totalReferrals, targetGoals.referrals);
    const invitePercentage = calculatePercentage(totalInvites, targetGoals.invites);

    const totalTargetPercentage = Math.floor(
      (jobPercentage + amountPercentage + referralPercentage + invitePercentage) / 4
    );
    const data = {
        jobs: { current: completedJobs, target: targetGoals.jobs, percentage: jobPercentage },
        amount: { current: currentAmount, target: targetGoals.amount, percentage: amountPercentage },
        referrals: { current: totalReferrals, target: targetGoals.referrals, percentage: referralPercentage },
        invites: { current: totalInvites, target: targetGoals.invites, percentage: invitePercentage },
        totalTargetPercentage,
        currency: target.currency,
        duration: target.duration
      };

    return successResponse(res, StatusCodes.OK, data);
});


