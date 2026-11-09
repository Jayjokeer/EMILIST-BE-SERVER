import { Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as supportService from "../services/support-request.service";
import { BadRequestError } from "../errors/error";

export const createSupportRequestController = catchAsync(async (req: JwtPayload, res: Response) => {
  const request = await supportService.createSupportRequest(String(req.user._id), req.body);
  return successResponse(res, StatusCodes.CREATED, request);
});

export const customerReplyToSupportRequestController = catchAsync(async (req: JwtPayload, res: Response) => {
  if (!req.params.requestId) throw new BadRequestError("Support request id is required");
  const request = await supportService.customerReplyToSupportRequest(
    String(req.params.requestId), String(req.user._id), req.body,
  );
  return successResponse(res, StatusCodes.CREATED, request);
});
