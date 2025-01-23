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
exports.verifyPaystackPaymentController = exports.payforJobController = exports.payforProductController = void 0;
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
const jobService = __importStar(require("../services/job.service"));
const jobs_enum_1 = require("../enums/jobs.enum");
const projectService = __importStar(require("../services/project.service"));
const orderService = __importStar(require("../services/order.service"));
const order_enum_1 = require("../enums/order.enum");
const planService = __importStar(require("../services/plan.service"));
const subscriptionService = __importStar(require("../services/subscription.service"));
const userService = __importStar(require("../services/auth.service"));
const suscribtion_enum_1 = require("../enums/suscribtion.enum");
const utility_1 = require("../utils/utility");
exports.payforProductController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = req.user._id;
    const { cartId, paymentMethod, currency } = req.body;
    let data;
    const cart = yield cartService.fetchCartByIdPayment(cartId, userId);
    if (!cart) {
        throw new error_1.NotFoundError("Cart not found");
    }
    ;
    if (((_a = cart.userId) === null || _a === void 0 ? void 0 : _a.toString()) !== userId.toString()) {
        throw new error_1.UnauthorizedError("Unauthorized access!");
    }
    const order = yield orderService.fetchOrderByCartId(cartId);
    if (!order) {
        throw new error_1.NotFoundError("Your order cannot be found");
    }
    const { vatAmount, totalAmount } = yield (0, utility_1.calculateVat)(order.totalAmount);
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
            orderId: order._id,
            serviceType: transaction_enum_1.ServiceEnum.material,
            vat: vatAmount,
        };
        const transaction = yield transactionService.createTransaction(transactionPayload);
        userWallet.balance -= totalAmount;
        yield userWallet.save();
        transaction.balanceAfter = userWallet.balance;
        yield transaction.save();
        cart.isPaid = true;
        order.paymentStatus = order_enum_1.OrderPaymentStatus.paid;
        yield order.save();
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
                orderId: order._id,
                serviceType: transaction_enum_1.ServiceEnum.material,
                vat: vatAmount,
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
exports.payforJobController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const { paymentMethod, currency, milestoneId, jobId, note } = req.body;
    let data;
    const job = yield jobService.fetchJobById(jobId);
    if (!job) {
        throw new error_1.NotFoundError("Job Not found");
    }
    const milestone = job.milestones.find((milestone) => milestone._id.toString() === milestoneId);
    if (!milestone) {
        throw new error_1.NotFoundError("No milestone");
    }
    if (note) {
        milestone.paymentInfo.note = note;
        yield job.save();
    }
    const project = yield projectService.fetchProjectById(String(job.acceptedApplicationId));
    if (!project) {
        throw new error_1.NotFoundError("Application not found");
    }
    // const {vatAmount,totalAmount } = await calculateVat(milestone.amount);
    if (paymentMethod === transaction_enum_1.PaymentMethodEnum.wallet) {
        const userWallet = yield walletService.findUserWalletByCurrency(userId, currency);
        if (!userWallet || userWallet.balance < milestone.amount) {
            throw new error_1.BadRequestError("Insufficient wallet balance");
        }
        const transactionPayload = {
            userId,
            type: transaction_enum_1.TransactionType.DEBIT,
            amount: milestone.amount,
            description: `Job payment via wallet`,
            paymentMethod: paymentMethod,
            balanceBefore: userWallet.balance,
            walletId: userWallet._id,
            currency: userWallet.currency,
            status: transaction_enum_1.TransactionEnum.completed,
            jobId,
            milestoneId,
            recieverId: project.user,
            serviceType: transaction_enum_1.ServiceEnum.job,
            // vat: vatAmount,
        };
        const transaction = yield transactionService.createTransaction(transactionPayload);
        userWallet.balance -= milestone.amount;
        yield userWallet.save();
        transaction.balanceAfter = userWallet.balance;
        milestone.paymentStatus = jobs_enum_1.MilestonePaymentStatus.paid;
        milestone.paymentInfo.amountPaid = milestone.amount;
        milestone.paymentInfo.paymentMethod = transaction_enum_1.PaymentMethodEnum.wallet;
        milestone.paymentInfo.date = new Date();
        yield job.save();
        data = "Payment successful";
    }
    else if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card) {
        if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card && currency === transaction_enum_1.WalletEnum.NGN) {
            const transactionPayload = {
                userId,
                amount: milestone.amount,
                type: transaction_enum_1.TransactionType.DEBIT,
                description: `Job payment via card`,
                paymentMethod: paymentMethod,
                currency: currency,
                status: transaction_enum_1.TransactionEnum.pending,
                reference: `PS-${Date.now()}`,
                jobId,
                milestoneId,
                recieverId: project.user,
                serviceType: transaction_enum_1.ServiceEnum.job,
                // vat: vatAmount,
            };
            const transaction = yield transactionService.createTransaction(transactionPayload);
            transaction.paymentService = transaction_enum_1.PaymentServiceEnum.paystack;
            yield transaction.save();
            const paymentLink = yield (0, paystack_1.generatePaystackPaymentLink)(transaction.reference, milestone.amount, req.user.email);
            data = { paymentLink, transaction };
        }
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
}));
exports.verifyPaystackPaymentController = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reference } = req.params;
    const transaction = yield transactionService.fetchTransactionByReference(reference);
    let message;
    if (!transaction) {
        throw new error_1.NotFoundError("Transaction not found!");
    }
    ;
    if (transaction.serviceType === transaction_enum_1.ServiceEnum.job) {
        const job = yield jobService.fetchJobById(transaction.jobId);
        if (!job) {
            throw new error_1.NotFoundError("Job Not found");
        }
        const milestone = job.milestones.find((milestone) => milestone._id.toString() === transaction.milestoneId.toString());
        if (!milestone) {
            throw new error_1.NotFoundError("No milestone");
        }
        const verifyPayment = yield (0, paystack_1.verifyPaystackPayment)(reference);
        if (verifyPayment == "success") {
            milestone.paymentStatus = jobs_enum_1.MilestonePaymentStatus.paid;
            milestone.paymentInfo.amountPaid = milestone.amount;
            milestone.paymentInfo.paymentMethod = transaction_enum_1.PaymentMethodEnum.card;
            milestone.paymentInfo.date = new Date();
            transaction.status = transaction_enum_1.TransactionEnum.completed;
            transaction.dateCompleted = new Date();
            yield transaction.save();
            yield job.save();
            message = "Payment successfully";
        }
        else {
            transaction.status = transaction_enum_1.TransactionEnum.failed;
            message = "Payment failed";
            yield transaction.save();
        }
    }
    else if (transaction.serviceType === transaction_enum_1.ServiceEnum.material) {
        const cart = yield cartService.fetchCartByIdPayment(transaction.cartId, String(transaction.userId));
        if (!cart) {
            throw new error_1.NotFoundError("Cart not found or unauthorized access");
        }
        ;
        const order = yield orderService.fetchOrderByCartId(String(cart._id));
        if (!order) {
            throw new error_1.NotFoundError("Your order cannot be found");
        }
        const verifyPayment = yield (0, paystack_1.verifyPaystackPayment)(reference);
        if (verifyPayment == "success") {
            cart.isPaid = true;
            cart.status = cart_enum_1.CartStatus.checkedOut;
            yield cart.save();
            transaction.status = transaction_enum_1.TransactionEnum.completed;
            transaction.dateCompleted = new Date();
            yield transaction.save();
            order.paymentStatus = order_enum_1.OrderPaymentStatus.paid;
            yield order.save();
            message = "Payment successfully";
        }
        else {
            transaction.status = transaction_enum_1.TransactionEnum.failed;
            message = "Payment failed";
            yield transaction.save();
        }
    }
    else if (transaction.serviceType === transaction_enum_1.ServiceEnum.walletFunding) {
        const wallet = yield walletService.findWallet(String(transaction.userId), transaction.currency, transaction.walletId);
        if (!wallet) {
            throw new error_1.NotFoundError("Wallet not found!");
        }
        ;
        let message;
        const verifyPayment = yield (0, paystack_1.verifyPaystackPayment)(reference);
        if (verifyPayment == "success") {
            transaction.dateCompleted = new Date();
            transaction.status = transaction_enum_1.TransactionEnum.completed;
            transaction.balanceAfter = wallet.balance + transaction.amount;
            yield Promise.all([transaction.save(), walletService.fundWallet(String(transaction.walletId), transaction.amount)]);
            message = "Wallet funded successfully";
        }
        else {
            transaction.status = transaction_enum_1.TransactionEnum.failed;
            message = "Wallet funding failed";
            yield transaction.save();
        }
    }
    else if (transaction.serviceType === transaction_enum_1.ServiceEnum.subscription) {
        const plan = yield planService.getPlanById(transaction.planId);
        if (!plan) {
            throw new error_1.NotFoundError("Plan not found");
        }
        const user = yield userService.findUserById(String(transaction.userId));
        if (!user) {
            throw new error_1.NotFoundError("User not found");
        }
        const verifyPayment = yield (0, paystack_1.verifyPaystackPayment)(reference);
        if (verifyPayment == "success") {
            transaction.dateCompleted = new Date();
            transaction.status = transaction_enum_1.TransactionEnum.completed;
            yield transaction.save();
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + plan.duration);
            message = yield subscriptionService.createSubscription({
                userId: transaction.userId,
                planId: transaction.planId,
                perks: plan.perks,
                startDate,
                endDate,
            });
            user.subscription = message._id;
            const subscription = yield subscriptionService.getActiveSubscriptionWithoutDetails(String(transaction.userId));
            subscription.status = suscribtion_enum_1.SubscriptionStatusEnum.expired;
            yield subscription.save();
            yield user.save();
        }
        else {
            transaction.status = transaction_enum_1.TransactionEnum.failed;
            message = "Subscription payment failed";
            yield transaction.save();
        }
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, message);
}));
