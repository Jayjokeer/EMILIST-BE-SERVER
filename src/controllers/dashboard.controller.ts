import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { Response } from "express";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as dashboardService from "../services/dashboard.service";

export const dashboardOverviewController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const data = await dashboardService.fetchDashboardOverview(userId);
  return successResponse(res, StatusCodes.OK, data);
});
