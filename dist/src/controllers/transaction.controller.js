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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchVatController = exports.fetchUserEarningsController = exports.fetchAllTransactionsByUsersController = exports.fetchAllTransactionsByStatusController = exports.fetchSingleTransactionController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const transactionService = __importStar(require("../services/transaction.service"));
const transaction_enum_1 = require("../enums/transaction.enum");
exports.fetchSingleTransactionController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { transactionId } = req.params;
    const data = await transactionService.fetchSingleTransactionWithDetails(transactionId);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchAllTransactionsByStatusController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { page, limit, status } = req.query;
    const data = await transactionService.adminFetchAllTransactionsByStatus(status, page, limit);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.fetchAllTransactionsByUsersController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { page, limit, paymentMethod } = req.query;
    const userId = req.user._id;
    const data = await transactionService.fetchAllTransactionsByUser(userId, page, limit, paymentMethod);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
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
