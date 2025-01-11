import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as transactionService from "../services/transaction.service";
import { NextFunction, Request, Response } from "express";
import { TransactionType } from "../enums/transaction.enum";

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

export const fetchAllTransactionsByUsersController =  catchAsync(async (req: JwtPayload, res: Response) => {
    const {page, limit, paymentMethod} = req.query;
    const userId = req.user._id;

    const data = await transactionService.fetchAllTransactionsByUser(userId, page, limit, paymentMethod );
    return successResponse(res, StatusCodes.OK, data);
});

export const fetchUserEarningsController =  catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { year, month } = req.query;

  const reportYear = parseInt(year as string, 10);
  const reportMonth = month ? parseInt(month as string, 10) : null;

  let startDate: Date;
  let endDate: Date;

  if (reportMonth) {
    startDate = new Date(reportYear, reportMonth - 1, 1);
    endDate = new Date(reportYear, reportMonth, 0);
  } else {
    startDate = new Date(reportYear, 0, 1);
    endDate = new Date(reportYear, 11, 31);
  }

  const transactions = await transactionService.fetchUserEarnings(userId, startDate, endDate);

  let totalEarned = 0;
  let totalSpent = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === TransactionType.CREDIT) {
      totalEarned += transaction.amount;
    } else if (transaction.type === TransactionType.DEBIT ) {
      totalSpent += transaction.amount;
    }
  });

  const earningsStatistics: { month: string; earned: number; spent: number }[] = [];

  if (!reportMonth) {
    for (let i = 0; i < 12; i++) {
      const monthlyStart = new Date(reportYear, i, 1);
      const monthlyEnd = new Date(reportYear, i + 1, 0);

      const monthlyTransactions = transactions.filter(
        (transaction) =>
          transaction.dateCompleted >= monthlyStart && transaction.dateCompleted <= monthlyEnd
      );

      let monthlyEarned = 0;
      let monthlySpent = 0;

      monthlyTransactions.forEach((transaction) => {
        if (transaction.type === TransactionType.CREDIT ) {
          monthlyEarned += transaction.amount;
        } else if (transaction.type === TransactionType.DEBIT ) {
          monthlySpent += transaction.amount;
        }
      });

      earningsStatistics.push({
        month: new Date(reportYear, i).toLocaleString('default', { month: 'short' }),
        earned: monthlyEarned,
        spent: monthlySpent,
      });
    }
  }

 const data = {
    totalEarned,
    totalSpent,
    earningsStatistics: reportMonth ? [] : earningsStatistics,
  };
  return successResponse(res, StatusCodes.OK, data);

});