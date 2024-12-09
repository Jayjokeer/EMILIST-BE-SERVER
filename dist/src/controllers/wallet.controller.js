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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateWalletFunding = exports.createWalletController = void 0;
const http_status_codes_1 = require("http-status-codes");
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const walletService = __importStar(require("../services/wallet.services"));
const error_1 = require("../errors/error");
const transactionService = __importStar(require("../services/transaction.service"));
const paystack_1 = require("../utils/paystack");
const transaction_enum_1 = require("../enums/transaction.enum");
exports.createWalletController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { currency, isDefault } = req.body;
    const data = yield walletService.createNewWallet(userId, currency, isDefault);
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
exports.initiateWalletFunding = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { currency, amount, paymentMethod, walletId } = req.body;
    const wallet = yield walletService.findWallet(userId, currency, walletId);
    if (!wallet)
        throw new error_1.NotFoundError('Wallet not found');
    const transactionPayload = {
        userId,
        type: transaction_enum_1.TransactionType.CREDIT,
        amount,
        description: `Wallet funding via ${paymentMethod}`,
        paymentMethod: paymentMethod,
        reference: paymentMethod === 'Paystack' ? `PS-${Date.now()}` : `BT-${Date.now()}`,
        recieverId: userId,
        balanceAfter: wallet.balance,
    };
    const transaction = yield transactionService.createTransaction(transactionPayload);
    if (paymentMethod === 'Paystack') {
        const paymentLink = yield (0, paystack_1.generatePaystackPaymentLink)(transaction.reference, amount, req.user.email);
        const data = { paymentLink, transaction };
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    else {
        if (req.file) {
            transaction.transferReceipt = req.file.path;
        }
        ;
        yield transaction.save();
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, "Wallet funding initiated successfully");
    }
}));
// export const verifyBankTransferWalletFunding =  catchAsync(async (req: JwtPayload, res: Response) => {
//   const userId = req.user._id;
//   const transaction = await transactionService. (transactionPayload);
//   if (req.file) {
//     transaction.transferReceipt = req.file.path;
//  };
//   await transaction.save();
//   return successResponse(res, StatusCodes.CREATED, "Wallet funding initiated successfully");
// }
// });
