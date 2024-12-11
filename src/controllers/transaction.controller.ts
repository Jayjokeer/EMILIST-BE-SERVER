import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as transactionService from "../services/transaction.service";
import { NextFunction, Request, Response } from "express";

export const fetchSingleTransactionController =  catchAsync(async (req: JwtPayload, res: Response) => {
    const {transactionId} = req.params;

    const data = await transactionService.fetchSingleTransactionWithDetails(transactionId);
    return successResponse(res, StatusCodes.OK, data);
  });
export const fetchAllTransactionsByStatusController =  catchAsync(async (req: JwtPayload, res: Response) => {
    const {page, limit, status} = req.query;

    const data = await transactionService.adminFetchAllTransactionsByStatus(status, page, limit);
    return successResponse(res, StatusCodes.OK, data);
  });
