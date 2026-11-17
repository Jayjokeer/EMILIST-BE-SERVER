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
import * as userReportService from "../services/user-report.service";

export const createTargetController = catchAsync( async (req: JwtPayload, res: Response) => {
    const targetData = req.body;
    const userId = req.user._id;
    targetData.userId  = userId;

    const data = await targetService.createTarget(targetData);

   return successResponse(res,StatusCodes.CREATED, data);
});

export const fetchDynamicTargetMetrics = catchAsync(async (req: JwtPayload, res: Response) => {
    const report = await userReportService.fetchUserReport(String(req.user._id), req.query);
    return successResponse(res, StatusCodes.OK, report.insights.targets);
});


