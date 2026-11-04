import { Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as supportService from "../services/support-request.service";

export const createSupportRequestController = catchAsync(async (req: JwtPayload, res: Response) => {
  const request = await supportService.createSupportRequest(String(req.user._id), req.body);
  return successResponse(res, StatusCodes.CREATED, request);
});
