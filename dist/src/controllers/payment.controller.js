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
exports.verifyPaystackProductPayment = exports.payforProductController = void 0;
const error_handler_1 = require("../errors/error-handler");
const success_response_1 = require("../helpers/success-response");
const cartService = __importStar(require("../services/cart.service"));
const walletService = __importStar(require("../services/wallet.services"));
const http_status_codes_1 = require("http-status-codes");
const error_1 = require("../errors/error");
const transaction_enum_1 = require("../enums/transaction.enum");
const transactionService = __importStar(require("../services/transaction.service"));
const paystack_1 = require("../utils/paystack");
const cart_enum_1 = require("../enums/cart.enum");
exports.payforProductController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.user._id;
    const { cartId, paymentMethod, currency } = req.body;
    let data;
    const cart = yield cartService.fetchCartByIdPayment(cartId, userId);
    if (!cart || ((_a = cart.userId) === null || _a === void 0 ? void 0 : _a.toString()) !== userId.toString()) {
        throw new error_1.NotFoundError("Cart not found or unauthorized access");
    }
    ;
    const totalAmount = cart.totalAmount;
    for (const item of cart.products) {
        const product = item.productId;
        if (product.availableQuantity < item.quantity) {
            throw new error_1.BadRequestError(`Insufficient stock for ${product.name}`);
        }
    }
    if (paymentMethod === transaction_enum_1.PaymentMethodEnum.wallet) {
        const userWallet = yield walletService.findUserWalletByCurrency(userId, currency);
        if (!userWallet || userWallet.balance < totalAmount) {
            throw new error_1.BadRequestError("Insufficient wallet balance");
        }
        const transactionPayload = {
            userId,
            type: transaction_enum_1.TransactionType.DEBIT,
            amount: totalAmount,
            description: `Product payment via wallet`,
            paymentMethod: paymentMethod,
            balanceBefore: userWallet.balance,
            walletId: userWallet._id,
            currency: userWallet.currency,
            status: transaction_enum_1.TransactionEnum.completed,
            cartId: cart._id,
        };
        const transaction = yield transactionService.createTransaction(transactionPayload);
        userWallet.balance -= totalAmount;
        yield userWallet.save();
        transaction.balanceAfter = userWallet.balance;
        yield transaction.save();
        cart.isPaid = true;
        cart.status = cart_enum_1.CartStatus.checkedOut;
        yield cart.save();
        data = "Payment successful";
    }
    else if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card) {
        if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card && currency === transaction_enum_1.WalletEnum.NGN) {
            const transactionPayload = {
                userId,
                type: transaction_enum_1.TransactionType.DEBIT,
                amount: totalAmount,
                description: `Product payment via card`,
                paymentMethod: paymentMethod,
                currency: currency,
                status: transaction_enum_1.TransactionEnum.pending,
                reference: `PS-${Date.now()}`,
                cartId: cart._id,
            };
            const transaction = yield transactionService.createTransaction(transactionPayload);
            transaction.paymentService = transaction_enum_1.PaymentServiceEnum.paystack;
            yield transaction.save();
            const paymentLink = yield (0, paystack_1.generatePaystackPaymentLink)(transaction.reference, cart.totalAmount, req.user.email);
            data = { paymentLink, transaction };
        }
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.verifyPaystackProductPayment = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reference } = req.params;
    const transaction = yield transactionService.fetchTransactionByReference(reference);
    if (!transaction) {
        throw new error_1.NotFoundError("Transaction not found!");
    }
    ;
    const cart = yield cartService.fetchCartByIdPayment(transaction.cartId, String(transaction.userId));
    if (!cart) {
        throw new error_1.NotFoundError("Cart not found or unauthorized access");
    }
    ;
    let message;
    const verifyPayment = yield (0, paystack_1.verifyPaystackPayment)(reference);
    if (verifyPayment == "success") {
        cart.isPaid = true;
        cart.status = cart_enum_1.CartStatus.checkedOut;
        yield cart.save();
        transaction.status = transaction_enum_1.TransactionEnum.completed;
        transaction.dateCompleted = new Date();
        yield transaction.save();
        message = "Payment successfully";
    }
    else {
        transaction.status = transaction_enum_1.TransactionEnum.failed;
        message = "Payment failed";
        yield transaction.save();
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, message);
}));
