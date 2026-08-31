"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadStatementController = exports.fetchMyTransactionController = exports.fetchTransactionSummaryController = exports.fetchVatController = exports.fetchUserEarningsController = exports.fetchAllTransactionsByUsersController = exports.fetchAllTransactionsByStatusController = exports.fetchSingleTransactionController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const transactionService = __importStar(require("../services/transaction.service"));
const error_1 = require("../errors/error");
const pdfkit_1 = __importDefault(require("pdfkit"));
const transaction_enum_1 = require("../enums/transaction.enum");
exports.fetchSingleTransactionController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { transactionId } = req.params;
    const data = await transactionService.fetchSingleTransactionWithDetails(transactionId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchAllTransactionsByStatusController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { page, limit, status, serviceType } = req.query;
    const data = await transactionService.adminFetchAllTransactionsByStatus(status, page, limit, serviceType);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
// Response mapping: model enums -> API vocabulary
// CREDIT -> inflow, DEBIT -> outflow; completed -> successful,
// declined -> failed, processing -> pending
const mapTransactionStatus = (status) => {
    if (!status)
        return null;
    if (status === transaction_enum_1.TransactionEnum.completed)
        return "successful";
    if (status === transaction_enum_1.TransactionEnum.declined)
        return "failed";
    if (status === transaction_enum_1.TransactionEnum.processing)
        return "pending";
    return status;
};
const serializeTransaction = (transaction) => ({
    transactionId: transaction._id,
    walletId: transaction.walletId?._id || transaction.walletId || null,
    currency: transaction.currency || null,
    amount: transaction.amount,
    transactionType: transaction.type === transaction_enum_1.TransactionType.CREDIT ? "inflow" : "outflow",
    status: mapTransactionStatus(transaction.status),
    counterparty: transaction.counterparty || transaction.description || null,
    date: transaction.dateCompleted || transaction.createdAt,
    balance: transaction.balanceAfter ?? transaction.balanceBefore ?? null,
    reference: transaction.reference || null,
    description: transaction.description || null,
    paymentMethod: transaction.paymentMethod || null,
});
exports.fetchAllTransactionsByUsersController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { page, limit, paymentMethod, status, type, search } = req.query;
    const userId = req.user._id;
    const data = await transactionService.fetchUserTransactionsFiltered(userId, {
        status: status,
        type: type,
        search: search,
        paymentMethod: paymentMethod,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, {
        transactions: data.transactions.map((transaction) => serializeTransaction(transaction)),
        totalTransactions: data.totalTransactions,
        totalPages: data.totalPages,
        page: data.page,
    });
});
exports.fetchUserEarningsController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { year, month, currency } = req.query;
    const reportYear = parseInt(year, 10);
    const reportMonth = month ? parseInt(month, 10) : null;
    const selectedCurrency = currency ? currency.toString().toUpperCase() : null;
    let startDate;
    let endDate;
    if (reportMonth) {
        startDate = new Date(reportYear, reportMonth - 1, 1);
        endDate = new Date(reportYear, reportMonth, 0);
    }
    else {
        startDate = new Date(reportYear, 0, 1);
        endDate = new Date(reportYear, 11, 31);
    }
    const transactions = await transactionService.fetchUserEarnings(userId, startDate, endDate);
    const totalsByCurrency = {};
    transactions.forEach((transaction) => {
        const currency = transaction.currency;
        if (!totalsByCurrency[currency]) {
            totalsByCurrency[currency] = { earned: 0, expenses: 0 };
        }
        if (String(transaction.recieverId) === String(userId) &&
            (transaction.serviceType === transaction_enum_1.ServiceEnum.job || transaction.serviceType === transaction_enum_1.ServiceEnum.material)) {
            totalsByCurrency[currency].earned += transaction.amount;
        }
        else if (transaction.type === transaction_enum_1.TransactionType.DEBIT) {
            totalsByCurrency[currency].expenses += transaction.amount;
        }
    });
    const earningsStatistics = [];
    if (!reportMonth) {
        for (let i = 0; i < 12; i++) {
            const monthlyStart = new Date(reportYear, i, 1);
            const monthlyEnd = new Date(reportYear, i + 1, 0);
            const monthlyTransactions = transactions.filter((transaction) => transaction.dateCompleted >= monthlyStart && transaction.dateCompleted <= monthlyEnd);
            const monthlyTotalsByCurrency = {};
            monthlyTransactions.forEach((transaction) => {
                const currency = transaction.currency || "unknown";
                if (!monthlyTotalsByCurrency[currency]) {
                    monthlyTotalsByCurrency[currency] = { earned: 0, expenses: 0 };
                }
                if (String(transaction.recieverId) === String(userId) &&
                    (transaction.serviceType === transaction_enum_1.ServiceEnum.job || transaction.serviceType === transaction_enum_1.ServiceEnum.material)) {
                    monthlyTotalsByCurrency[currency].earned += transaction.amount;
                }
                else if (transaction.type === transaction_enum_1.TransactionType.DEBIT) {
                    monthlyTotalsByCurrency[currency].expenses += transaction.amount;
                }
            });
            const monthlyData = {
                period: `${new Date(reportYear, i).toLocaleString("default", { month: "short" })} ${reportYear}`,
            };
            if (selectedCurrency) {
                monthlyData[selectedCurrency] = monthlyTotalsByCurrency[selectedCurrency]?.earned || 0;
                monthlyData[`${selectedCurrency}_expenses`] = monthlyTotalsByCurrency[selectedCurrency]?.expenses || 0;
            }
            else {
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
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchVatController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const vat = await transactionService.getVat();
    const data = vat.vat;
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchTransactionSummaryController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const data = await transactionService.fetchTransactionSummary(req.user._id, String(req.query.range));
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchMyTransactionController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const transaction = await transactionService.fetchUserTransactionById(req.user._id, req.params.transactionId);
    if (!transaction)
        throw new error_1.NotFoundError("Transaction not found");
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, serializeTransaction(transaction));
});
const csvEscape = (value) => {
    const str = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};
const buildStatementCsv = (transactions) => {
    const header = ["Transaction ID", "Date", "Type", "Status", "Amount", "Currency", "Balance", "Counterparty", "Reference", "Description"];
    const rows = transactions.map((transaction) => {
        const s = serializeTransaction(transaction);
        return [s.transactionId, s.date, s.transactionType, s.status, s.amount, s.currency, s.balance, s.counterparty, s.reference, s.description];
    });
    // BOM so Excel opens the UTF-8 file correctly
    return "\uFEFF" + [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
};
const buildStatementPdf = (transactions, user, periodLabel) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({ margin: 40, size: "A4" });
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);
            doc.fontSize(16).font("Helvetica-Bold").text("Transaction Statement");
            doc.moveDown(0.25);
            doc.fontSize(9).font("Helvetica").fillColor("#555555");
            doc.text(`${user.fullName || user.email || "Emilist user"}${user.uniqueId ? ` (${user.uniqueId})` : ""}`);
            doc.text(`Period: ${periodLabel}`);
            doc.text(`Generated: ${new Date().toISOString()}`);
            doc.moveDown(1).fillColor("#000000");
            transactions.forEach((transaction, index) => {
                const s = serializeTransaction(transaction);
                doc.fontSize(9).font("Helvetica-Bold").text(`${index + 1}. ${String(s.transactionType).toUpperCase()} - ${s.currency || ""} ${s.amount} (${s.status})`);
                doc.fontSize(8).font("Helvetica").fillColor("#444444");
                doc.text(`Date: ${s.date}   Balance: ${s.balance ?? "-"}`);
                doc.text(`Counterparty: ${s.counterparty ?? "-"}`);
                doc.text(`Reference: ${s.reference ?? "-"}   ID: ${s.transactionId}`);
                if (s.description)
                    doc.text(`Description: ${s.description}`);
                doc.moveDown(0.5).fillColor("#000000");
                if (doc.y > doc.page.height - 100)
                    doc.addPage();
            });
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
};
// GET /transaction/download-statement?format=pdf|csv&startDate&endDate&status
// Streams the file with proper Content-Disposition / Content-Type headers.
exports.downloadStatementController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { format, startDate, endDate, status } = req.query;
    const transactions = await transactionService.fetchTransactionsForStatement(req.user._id, startDate ? new Date(String(startDate)) : undefined, endDate ? new Date(String(endDate)) : undefined, status ? String(status) : undefined);
    const safeName = `${req.user.uniqueId || req.user._id}-${String(startDate || "all")}_${String(endDate || "all")}`.replace(/[^a-zA-Z0-9_-]/g, "-");
    const filename = `statement-${safeName}.${format}`;
    if (String(format) === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.status(http_status_codes_1.StatusCodes.OK).send(buildStatementCsv(transactions));
    }
    const periodLabel = `${startDate || "all"} to ${endDate || "all"}`;
    const pdfBuffer = await buildStatementPdf(transactions, req.user, periodLabel);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(http_status_codes_1.StatusCodes.OK).send(pdfBuffer);
});
