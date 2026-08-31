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
exports.WalletRoute = void 0;
const express_1 = require("express");
const current_user_1 = require("../middlewares/current-user");
const image_upload_1 = require("../utils/image-upload");
const walletController = __importStar(require("../controllers/wallet.controller"));
const wallet_validation_1 = require("../validations/wallet.validation");
const router = (0, express_1.Router)();
exports.WalletRoute = router;
router.route("/create-wallet").post(current_user_1.userAuth, wallet_validation_1.validateCreateWallet, walletController.createWalletController);
router.route("/fetch-wallets").get(current_user_1.userAuth, walletController.fetchWalletsController);
router.route("/fetch-wallet/:walletId").get(current_user_1.userAuth, walletController.fetchWalletDetailController);
router.route("/set-default-wallet/:walletId").patch(current_user_1.userAuth, walletController.setDefaultWalletController);
router.route("/fetch-payment-methods").get(current_user_1.userAuth, walletController.fetchPaymentMethodsController);
router.route("/fetch-banks").get(current_user_1.userAuth, walletController.fetchBanksController);
router.route("/initiate-wallet-funding").post(current_user_1.userAuth, image_upload_1.singleUpload, wallet_validation_1.validateInitiateWalletFunding, walletController.initiateWalletFunding);
router.route("/fetch-bank-accounts").get(current_user_1.userAuth, walletController.fetchBankAccountsController);
router.route("/add-bank-account").post(current_user_1.userAuth, wallet_validation_1.validateAddBankAccount, walletController.addBankAccountController);
router.route("/withdraw-funds").post(current_user_1.userAuth, wallet_validation_1.validateWithdrawFunds, walletController.withdrawFundsController);
