import { Request, Response } from "express";
import { verifyPaystackWebhookSignature } from "../utils/paystack";
import * as transactionService from "../services/transaction.service";
import * as walletService from "../services/wallet.services";
import { ServiceEnum, TransactionType } from "../enums/transaction.enum";
import Wallet from "../models/wallet.model";

// Handles Paystack events:
// - charge.success / charge.failed                          -> wallet funding
// - transfer.success / transfer.failed / transfer.reversed  -> withdrawals
// Idempotent: duplicate webhook deliveries are detected via the transaction
// reference + status guards, so a wallet is never credited/debited twice.
export const paystackWebhookController = async (req: Request, res: Response) => {
  const signature = req.headers["x-paystack-signature"] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!signature || !verifyPaystackWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ status: false, message: "Invalid signature" });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
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
          if (transaction.type === TransactionType.CREDIT && transaction.serviceType === ServiceEnum.walletFunding) {
            const wallet = await Wallet.findById(transaction.walletId);
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
        if (result && !result.alreadyProcessed) await result.transaction.save();
        break;
      }
      case "transfer.success": {
        const result = await transactionService.markTransactionCompletedByReference(event.data?.reference);
        if (result && !result.alreadyProcessed) await result.transaction.save();
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
  } catch (error) {
    // Never fail after auth - Paystack retries non-2xx responses
    console.error("Paystack webhook processing error:", error);
  }

  return res.status(200).json({ status: true });
};