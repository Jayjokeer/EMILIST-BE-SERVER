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
exports.paystackWebhookController = void 0;
const paystack_1 = require("../utils/paystack");
const transactionService = __importStar(require("../services/transaction.service"));
const walletService = __importStar(require("../services/wallet.services"));
const transaction_enum_1 = require("../enums/transaction.enum");
const wallet_model_1 = __importDefault(require("../models/wallet.model"));
// Handles Paystack events:
// - charge.success / charge.failed                          -> wallet funding
// - transfer.success / transfer.failed / transfer.reversed  -> withdrawals
// Idempotent: duplicate webhook deliveries are detected via the transaction
// reference + status guards, so a wallet is never credited/debited twice.
const paystackWebhookController = async (req, res) => {
    const signature = req.headers["x-paystack-signature"];
    const rawBody = req.body;
    if (!signature || !(0, paystack_1.verifyPaystackWebhookSignature)(rawBody, signature)) {
        return res.status(401).json({ status: false, message: "Invalid signature" });
    }
    let event;
    try {
        event = JSON.parse(rawBody.toString("utf8"));
    }
    catch {
        return res.status(400).json({ status: false, message: "Invalid payload" });
    }
    try {
        switch (event?.event) {
            case "charge.success": {
                const result = await transactionService.markTransactionCompletedByReference(event.data?.reference);
                if (result && !result.alreadyProcessed) {
                    const { transaction } = result;
                    // Only wallet funding credits a wallet here; other flows (orders,
                    // subscriptions) keep their own verification paths.
                    if (transaction.type === transaction_enum_1.TransactionType.CREDIT && transaction.serviceType === transaction_enum_1.ServiceEnum.walletFunding) {
                        const wallet = await wallet_model_1.default.findById(transaction.walletId);
                        if (wallet) {
                            wallet.balance += transaction.amount;
                            await wallet.save();
                            transaction.balanceAfter = wallet.balance;
                        }
                        await transaction.save();
                    }
                }
                break;
            }
            case "charge.failed": {
                const result = await transactionService.markTransactionFailedByReference(event.data?.reference);
                if (result && !result.alreadyProcessed)
                    await result.transaction.save();
                break;
            }
            case "transfer.success": {
                const result = await transactionService.markTransactionCompletedByReference(event.data?.reference);
                if (result && !result.alreadyProcessed)
                    await result.transaction.save();
                break;
            }
            case "transfer.failed":
            case "transfer.reversed": {
                // Refund the held amount back to the wallet if it was not refunded yet
                await walletService.refundFailedWithdrawalByReference(event.data?.reference);
                break;
            }
            default:
                break;
        }
    }
    catch (error) {
        // Never fail after auth - Paystack retries non-2xx responses
        console.error("Paystack webhook processing error:", error);
    }
    return res.status(200).json({ status: true });
};
exports.paystackWebhookController = paystackWebhookController;
