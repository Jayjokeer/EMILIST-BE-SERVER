import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as transactionService from "../services/transaction.service";
import { NextFunction, Request, Response } from "express";
import { ServiceEnum, TransactionType } from "../enums/transaction.enum";

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

export const fetchUserEarningsController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { year, month, currency } = req.query;

  const reportYear = parseInt(year as string, 10);
  const reportMonth = month ? parseInt(month as string, 10) : null;
  const selectedCurrency = currency ? currency.toString().toUpperCase() : null;

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

  const totalsByCurrency: {
    [currency: string]: { earned: number; expenses: number };
  } = {};

  transactions.forEach((transaction) => {
    const currency = transaction.currency;

    if (!totalsByCurrency[currency]) {
      totalsByCurrency[currency] = { earned: 0, expenses: 0 };
    }

    if (
      String(transaction.recieverId) === String(userId) &&
      (transaction.serviceType === ServiceEnum.job || transaction.serviceType === ServiceEnum.material)
    ) {
      totalsByCurrency[currency].earned += transaction.amount;
    } else if (transaction.type === TransactionType.DEBIT) {
      totalsByCurrency[currency].expenses += transaction.amount;
    }
  });

  const earningsStatistics: {
    period: string;
    [currency: string]: number | string;
  }[] = [];

  if (!reportMonth) {
    for (let i = 0; i < 12; i++) {
      const monthlyStart = new Date(reportYear, i, 1);
      const monthlyEnd = new Date(reportYear, i + 1, 0);

      const monthlyTransactions = transactions.filter(
        (transaction) =>
          transaction.dateCompleted >= monthlyStart && transaction.dateCompleted <= monthlyEnd
      );

      const monthlyTotalsByCurrency: {
        [currency: string]: { earned: number; expenses: number };
      } = {};

      monthlyTransactions.forEach((transaction) => {
        const currency = transaction.currency || "unknown";

        if (!monthlyTotalsByCurrency[currency]) {
          monthlyTotalsByCurrency[currency] = { earned: 0, expenses: 0 };
        }

        if (
          String(transaction.recieverId) === String(userId) &&
          (transaction.serviceType === ServiceEnum.job || transaction.serviceType === ServiceEnum.material)
        ) {
          monthlyTotalsByCurrency[currency].earned += transaction.amount;
        } else if (transaction.type === TransactionType.DEBIT) {
          monthlyTotalsByCurrency[currency].expenses += transaction.amount;
        }
      });

      const monthlyData: { period: string; [currency: string]: number | string } = {
        period: `${new Date(reportYear, i).toLocaleString("default", { month: "short" })} ${reportYear}`,
      };

      if (selectedCurrency) {
        monthlyData[selectedCurrency] = monthlyTotalsByCurrency[selectedCurrency]?.earned || 0;
        monthlyData[`${selectedCurrency}_expenses`] = monthlyTotalsByCurrency[selectedCurrency]?.expenses || 0;
      } else {
        ["NGN", "USD", "GBP", "EUR"].forEach((currency) => {
          monthlyData[currency] = monthlyTotalsByCurrency[currency]?.earned || 0;
          monthlyData[`${currency}_expenses`] = monthlyTotalsByCurrency[currency]?.expenses || 0;
        });
      }

      earningsStatistics.push(monthlyData);
    }
  }

  const data = {
    totalsByCurrency: selectedCurrency
      ? { [selectedCurrency]: totalsByCurrency[selectedCurrency] || { earned: 0, expenses: 0 } }
      : totalsByCurrency,
    earningsStatistics: reportMonth ? [] : earningsStatistics,
  };

  return successResponse(res, StatusCodes.OK, data);
});




export const fetchVatController =  catchAsync(async (req: JwtPayload, res: Response) => {
  const vat = await transactionService.getVat();
  const data = vat!.vat;

  return successResponse(res, StatusCodes.OK, data);
});