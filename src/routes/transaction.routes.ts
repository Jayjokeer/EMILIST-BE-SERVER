import { Router, Request, Response } from "express";
import { adminAuth, userAuth } from "../middlewares/current-user";
import * as transactionController from "../controllers/transaction.controller";
const router = Router();


router.route("/fetch-single-transaction/:transactionId").get(adminAuth,transactionController.fetchSingleTransactionController);
router.route("/fetch-all-transactions-by-status").get(adminAuth,transactionController.fetchAllTransactionsByStatusController);

export { router as TransactionRoute };