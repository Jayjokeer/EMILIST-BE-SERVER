import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as transactionService from "../services/transaction.service";
import { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../errors/error";
import PDFDocument from "pdfkit";
import { ServiceEnum, TransactionEnum, TransactionType } from "../enums/transaction.enum";

export const fetchSingleTransactionController =  catchAsync(async (req: JwtPayload, res: Response) => {
    const {transactionId} = req.params;

    const data = await transactionService.fetchSingleTransactionWithDetails(transactionId);
    return successResponse(res, StatusCodes.OK, data);
  });
export const fetchAllTransactionsByStatusController =  catchAsync(async (req: JwtPayload, res: Response) => {
    const {page, limit, status, serviceType} = req.query;

    const data = await transactionService.adminFetchAllTransactionsByStatus(status, page, limit, serviceType as ServiceEnum | undefined);
    return successResponse(res, StatusCodes.OK, data);
  });

// Response mapping: model enums -> API vocabulary
// CREDIT -> inflow, DEBIT -> outflow; completed -> successful,
// declined -> failed, processing -> pending
const mapTransactionStatus = (status?: string) => {
  if (!status) return null;
  if (status === TransactionEnum.completed) return "successful";
  if (status === TransactionEnum.declined) return "failed";
  if (status === TransactionEnum.processing) return "pending";
  return status;
};

const serializeTransaction = (transaction: any) => ({
  transactionId: transaction._id,
  walletId: transaction.walletId?._id || transaction.walletId || null,
  currency: transaction.currency || null,
  amount: transaction.amount,
  transactionType: transaction.type === TransactionType.CREDIT ? "inflow" : "outflow",
  status: mapTransactionStatus(transaction.status),
  counterparty: transaction.counterparty || transaction.description || null,
  date: transaction.dateCompleted || transaction.createdAt,
  balance: transaction.balanceAfter ?? transaction.balanceBefore ?? null,
  reference: transaction.reference || null,
  description: transaction.description || null,
  paymentMethod: transaction.paymentMethod || null,
});

export const fetchAllTransactionsByUsersController =  catchAsync(async (req: JwtPayload, res: Response) => {
    const { page, limit, paymentMethod, status, type, search } = req.query;
    const userId = req.user._id;

    const data = await transactionService.fetchUserTransactionsFiltered(userId, {
      status: status as string | undefined,
      type: type as string | undefined,
      search: search as string | undefined,
      paymentMethod: paymentMethod as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return successResponse(res, StatusCodes.OK, {
      transactions: data.transactions.map((transaction: any) => serializeTransaction(transaction)),
      totalTransactions: data.totalTransactions,
      totalPages: data.totalPages,
      page: data.page,
    });
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

export const fetchTransactionSummaryController = catchAsync(async (req: JwtPayload, res: Response) => {
  const data = await transactionService.fetchTransactionSummary(req.user._id, String(req.query.range));
  return successResponse(res, StatusCodes.OK, data);
});

export const fetchMyTransactionController = catchAsync(async (req: JwtPayload, res: Response) => {
  const transaction = await transactionService.fetchUserTransactionById(req.user._id, req.params.transactionId);
  if (!transaction) throw new NotFoundError("Transaction not found");
  return successResponse(res, StatusCodes.OK, serializeTransaction(transaction));
});

const csvEscape = (value: any) => {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const buildStatementCsv = (transactions: any[]) => {
  const header = ["Transaction ID", "Date", "Type", "Status", "Amount", "Currency", "Balance", "Counterparty", "Reference", "Description"];
  const rows = transactions.map((transaction: any) => {
    const s = serializeTransaction(transaction);
    return [s.transactionId, s.date, s.transactionType, s.status, s.amount, s.currency, s.balance, s.counterparty, s.reference, s.description];
  });
  // BOM so Excel opens the UTF-8 file correctly
  return "\uFEFF" + [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
};

const buildStatementPdf = (transactions: any[], user: any, periodLabel: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(16).font("Helvetica-Bold").text("Transaction Statement");
      doc.moveDown(0.25);
      doc.fontSize(9).font("Helvetica").fillColor("#555555");
      doc.text(`${user.fullName || user.email || "Emilist user"}${user.uniqueId ? ` (${user.uniqueId})` : ""}`);
      doc.text(`Period: ${periodLabel}`);
      doc.text(`Generated: ${new Date().toISOString()}`);
      doc.moveDown(1).fillColor("#000000");

      transactions.forEach((transaction: any, index: number) => {
        const s = serializeTransaction(transaction);
        doc.fontSize(9).font("Helvetica-Bold").text(`${index + 1}. ${String(s.transactionType).toUpperCase()} - ${s.currency || ""} ${s.amount} (${s.status})`);
        doc.fontSize(8).font("Helvetica").fillColor("#444444");
        doc.text(`Date: ${s.date}   Balance: ${s.balance ?? "-"}`);
        doc.text(`Counterparty: ${s.counterparty ?? "-"}`);
        doc.text(`Reference: ${s.reference ?? "-"}   ID: ${s.transactionId}`);
        if (s.description) doc.text(`Description: ${s.description}`);
        doc.moveDown(0.5).fillColor("#000000");
        if (doc.y > doc.page.height - 100) doc.addPage();
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// GET /transaction/download-statement?format=pdf|csv&startDate&endDate&status
// Streams the file with proper Content-Disposition / Content-Type headers.
export const downloadStatementController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { format, startDate, endDate, status } = req.query;

  const transactions = await transactionService.fetchTransactionsForStatement(
    req.user._id,
    startDate ? new Date(String(startDate)) : undefined,
    endDate ? new Date(String(endDate)) : undefined,
    status ? String(status) : undefined
  );

  const safeName = `${req.user.uniqueId || req.user._id}-${String(startDate || "all")}_${String(endDate || "all")}`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const filename = `statement-${safeName}.${format}`;

  if (String(format) === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(StatusCodes.OK).send(buildStatementCsv(transactions));
  }

  const periodLabel = `${startDate || "all"} to ${endDate || "all"}`;
  const pdfBuffer = await buildStatementPdf(transactions, req.user, periodLabel);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(StatusCodes.OK).send(pdfBuffer);
});