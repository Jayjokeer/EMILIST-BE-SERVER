import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { NextFunction, Request, Response } from "express";
import * as notificationService from "../services/notification.service";

export const getAllUserNotificationsController = catchAsync(async (req: JwtPayload, res: Response) => {
    const {page = 1, limit = 10} = req.query;
    const userId = req.user._id;


    const data = await notificationService.fetchUserNotifications(userId);
    return successResponse(res, StatusCodes.OK, data);
});