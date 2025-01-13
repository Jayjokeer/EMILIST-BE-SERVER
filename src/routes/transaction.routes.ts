import { Router, Request, Response } from "express";
import { adminAuth, userAuth } from "../middlewares/current-user";
import * as transactionController from "../controllers/transaction.controller";
const router = Router();
import * as paymentController from "../controllers/payment.controller";


router.route("/fetch-single-transaction/:transactionId").get(adminAuth,transactionController.fetchSingleTransactionController);
router.route("/fetch-all-transactions-by-status").get(adminAuth,transactionController.fetchAllTransactionsByStatusController);
router.route("/fetch-all-user-transactions").get(userAuth,transactionController.fetchAllTransactionsByUsersController);
router.route("/verify-paystack-payment/:reference").get(paymentController.verifyPaystackPaymentController);
router.route("/fetch-user-earning" ).get(userAuth,transactionController.fetchUserEarningsController)
export { router as TransactionRoute };