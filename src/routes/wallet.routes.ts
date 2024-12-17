import { Router, Request, Response } from "express";
import { adminAuth, userAuth } from "../middlewares/current-user";
import { multipleUpload, singleUpload } from "../utils/image-upload";
import * as walletController from "../controllers/wallet.controller";
const router = Router();

router.route("/create-wallet").post(userAuth, walletController.createWalletController);
router.route("/initiate-wallet-funding").post(userAuth, singleUpload,walletController.initiateWalletFunding);
router.route("/verify-bank-transfer").post(adminAuth,walletController.verifyBankTransferWalletFunding);

export { router as WalletRoute };