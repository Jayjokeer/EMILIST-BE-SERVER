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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRoute = void 0;
const express_1 = require("express");
const current_user_1 = require("../middlewares/current-user");
const image_upload_1 = require("../utils/image-upload");
const walletController = __importStar(require("../controllers/wallet.controller"));
const router = (0, express_1.Router)();
exports.WalletRoute = router;
router.route("/create-wallet").post(current_user_1.userAuth, walletController.createWalletController);
router.route("/initiate-wallet-funding").post(current_user_1.userAuth, image_upload_1.singleUpload, walletController.initiateWalletFunding);
router.route("/verify-paystack/:reference").get(walletController.verifyPaystackCardWalletFunding);
router.route("/verify-bank-transfer").post(current_user_1.adminAuth, walletController.verifyBankTransferWalletFunding);
