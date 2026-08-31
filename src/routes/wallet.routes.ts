import { Router, Request, Response } from "express";
import { adminAuth, userAuth } from "../middlewares/current-user";
import { multipleUpload, singleUpload } from "../utils/image-upload";
import * as walletController from "../controllers/wallet.controller";
import {
  validateAddBankAccount,
  validateCreateWallet,
  validateInitiateWalletFunding,
  validateWithdrawFunds,
} from "../validations/wallet.validation";
const router = Router();

router.route("/create-wallet").post(userAuth, validateCreateWallet, walletController.createWalletController);
router.route("/fetch-wallets").get(userAuth, walletController.fetchWalletsController);
router.route("/fetch-wallet/:walletId").get(userAuth, walletController.fetchWalletDetailController);
router.route("/set-default-wallet/:walletId").patch(userAuth, walletController.setDefaultWalletController);
router.route("/fetch-payment-methods").get(userAuth, walletController.fetchPaymentMethodsController);
router.route("/fetch-banks").get(userAuth, walletController.fetchBanksController);
router.route("/initiate-wallet-funding").post(userAuth, singleUpload, validateInitiateWalletFunding, walletController.initiateWalletFunding);
router.route("/fetch-bank-accounts").get(userAuth, walletController.fetchBankAccountsController);
router.route("/add-bank-account").post(userAuth, validateAddBankAccount, walletController.addBankAccountController);
router.route("/withdraw-funds").post(userAuth, validateWithdrawFunds, walletController.withdrawFundsController);

export { router as WalletRoute };