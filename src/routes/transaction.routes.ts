import { Router, Request, Response } from "express";
import { adminAuth, userAuth } from "../middlewares/current-user";
import * as transactionController from "../controllers/transaction.controller";
const router = Router();
import * as paymentController from "../controllers/payment.controller";
import {
  validateStatementRequest,
  validateTransactionFilters,
  validateTransactionSummary,
} from "../validations/wallet.validation";


router.route("/fetch-single-transaction/:transactionId").get(adminAuth,transactionController.fetchSingleTransactionController);
router.route("/fetch-all-transactions-by-status").get(adminAuth,transactionController.fetchAllTransactionsByStatusController);
router.route("/fetch-all-user-transactions").get(userAuth, validateTransactionFilters, transactionController.fetchAllTransactionsByUsersController);
router.route("/verify-paystack-payment/:reference").get(paymentController.verifyPaystackPaymentController);
router.route("/fetch-user-earning" ).get(userAuth,transactionController.fetchUserEarningsController);
router.route("/fetch-vat").get(transactionController.fetchVatController);
router.route("/fetch-transaction-summary").get(userAuth, validateTransactionSummary, transactionController.fetchTransactionSummaryController);
router.route("/fetch-my-transaction/:transactionId").get(userAuth, transactionController.fetchMyTransactionController);
router.route("/download-statement").get(userAuth, validateStatementRequest, transactionController.downloadStatementController);
export { router as TransactionRoute };