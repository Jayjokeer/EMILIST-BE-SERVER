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
exports.verifyPaystackPaymentController = exports.payforVerificationController = exports.payforJobController = exports.payforProductController = void 0;
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
const verificationService = __importStar(require("../services/verification.service"));
const user_enums_1 = require("../enums/user.enums");
exports.payforProductController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { cartId, paymentMethod, currency } = req.body;
    let data;
    const cart = await cartService.fetchCartByIdPayment(cartId, userId);
    if (!cart) {
        throw new error_1.NotFoundError("Cart not found");
    }
    ;
    if (cart.userId?.toString() !== userId.toString()) {
        throw new error_1.UnauthorizedError("Unauthorized access!");
    }
    const order = await orderService.fetchOrderByCartId(cartId);
    if (!order) {
        throw new error_1.NotFoundError("Your order cannot be found");
    }
    const { vatAmount, totalAmount } = await (0, utility_1.calculateVat)(order.totalAmount);
    for (const item of cart.products) {
        const product = item.productId;
        if (product.availableQuantity < item.quantity) {
            throw new error_1.BadRequestError(`Insufficient stock for ${product.name}`);
        }
    }
    if (paymentMethod === transaction_enum_1.PaymentMethodEnum.wallet) {
        const userWallet = await walletService.findUserWalletByCurrency(userId, currency);
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
        const transaction = await transactionService.createTransaction(transactionPayload);
        userWallet.balance -= totalAmount;
        await userWallet.save();
        transaction.balanceAfter = userWallet.balance;
        await transaction.save();
        cart.isPaid = true;
        order.paymentStatus = order_enum_1.OrderPaymentStatus.paid;
        await order.save();
        cart.status = cart_enum_1.CartStatus.checkedOut;
        await cart.save();
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
            const transaction = await transactionService.createTransaction(transactionPayload);
            transaction.paymentService = transaction_enum_1.PaymentServiceEnum.paystack;
            await transaction.save();
            const paymentLink = await (0, paystack_1.generatePaystackPaymentLink)(transaction.reference, cart.totalAmount, req.user.email);
            data = { paymentLink, transaction };
        }
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.payforJobController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const { paymentMethod, currency, milestoneId, jobId, note, isAdditionalAmount } = req.body;
    let data;
    const job = await jobService.fetchJobById(jobId);
    if (!job) {
        throw new error_1.NotFoundError("Job Not found");
    }
    const milestone = job.milestones.find((milestone) => milestone._id.toString() === milestoneId);
    if (!milestone) {
        throw new error_1.NotFoundError("No milestone");
    }
    if (milestone.paymentStatus !== jobs_enum_1.MilestonePaymentStatus.unpaid) {
        throw new error_1.BadRequestError("Job has been paid");
    }
    if (note) {
        milestone.paymentInfo.note = note;
        await job.save();
    }
    let jobAmount = milestone.amount;
    if (isAdditionalAmount) {
        if (milestone.invoice.additionalAmount > 0) {
            jobAmount += milestone.invoice.additionalAmount;
        }
    }
    ;
    const project = await projectService.fetchProjectById(String(job.acceptedApplicationId));
    if (!project) {
        throw new error_1.NotFoundError("Application not found");
    }
    // const {vatAmount,totalAmount } = await calculateVat(milestone.amount);
    if (paymentMethod === transaction_enum_1.PaymentMethodEnum.wallet) {
        const userWallet = await walletService.findUserWalletByCurrency(userId, currency);
        console.log(userWallet);
        if (!userWallet || userWallet.balance < milestone.amount) {
            throw new error_1.BadRequestError("Insufficient wallet balance");
        }
        const transactionPayload = {
            userId,
            type: transaction_enum_1.TransactionType.DEBIT,
            amount: jobAmount,
            description: `Job payment via wallet`,
            paymentMethod: paymentMethod,
            balanceBefore: userWallet.balance,
            walletId: userWallet._id,
            currency: userWallet.currency,
            status: transaction_enum_1.TransactionEnum.processing,
            jobId,
            milestoneId,
            recieverId: project.user,
            serviceType: transaction_enum_1.ServiceEnum.job,
            // vat: vatAmount,
        };
        const transaction = await transactionService.createTransaction(transactionPayload);
        userWallet.balance -= Math.ceil(jobAmount);
        await userWallet.save();
        transaction.balanceAfter = userWallet.balance;
        await jobService.updateMilestone(transaction.jobId, transaction.milestoneId, {
            paymentStatus: jobs_enum_1.MilestonePaymentStatus.processing,
            paymentInfo: {
                amountPaid: transaction.amount,
                paymentMethod: transaction_enum_1.PaymentMethodEnum.wallet,
                date: new Date(),
            },
        });
        // job.markModified('milestones');
        await job.save();
        data = "Payment successful";
    }
    else if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card) {
        if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card && currency === transaction_enum_1.WalletEnum.NGN) {
            const transactionPayload = {
                userId,
                amount: Math.ceil(jobAmount),
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
            const transaction = await transactionService.createTransaction(transactionPayload);
            transaction.paymentService = transaction_enum_1.PaymentServiceEnum.paystack;
            await transaction.save();
            const paymentLink = await (0, paystack_1.generatePaystackPaymentLink)(transaction.reference, jobAmount, req.user.email);
            data = { paymentLink, transaction };
        }
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
});
exports.payforVerificationController = (0, error_handler_1.catchAsync)(async (req, res) => {
    try {
        const userId = req.user._id;
        const { paymentMethod, currency, verificationId } = req.body;
        const verification = await verificationService.findById(verificationId);
        if (!verification) {
            throw new error_1.NotFoundError('verification not found');
        }
        let data;
        const appConfig = await transactionService.fetchPriceForVerification();
        let amount;
        if (verification.type === user_enums_1.VerificationEnum.user) {
            amount = appConfig?.userVerificationPrice;
        }
        else if (verification.type === user_enums_1.VerificationEnum.certificate) {
            amount = appConfig?.certificateVerificationPrice;
        }
        else if (verification.type === user_enums_1.VerificationEnum.business) {
            amount = appConfig?.businessVerificationPrice;
        }
        if (paymentMethod === transaction_enum_1.PaymentMethodEnum.wallet) {
            const userWallet = await walletService.findUserWalletByCurrency(userId, currency);
            if (!userWallet || userWallet.balance < amount) {
                throw new error_1.BadRequestError("Insufficient wallet balance");
            }
            const transactionPayload = {
                userId,
                type: transaction_enum_1.TransactionType.DEBIT,
                amount: amount,
                description: `Verification payment via wallet`,
                paymentMethod: paymentMethod,
                balanceBefore: userWallet.balance,
                walletId: userWallet._id,
                currency: userWallet.currency,
                status: transaction_enum_1.TransactionEnum.processing,
                serviceType: transaction_enum_1.ServiceEnum.verification,
                verificationId,
            };
            const transaction = await transactionService.createTransaction(transactionPayload);
            userWallet.balance -= Math.ceil(Number(amount));
            await userWallet.save();
            transaction.balanceAfter = userWallet.balance;
            await verificationService.updateVerification(verificationId, {
                paymentStatus: order_enum_1.OrderPaymentStatus.paid,
            });
            data = "Payment successful";
        }
        else if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card) {
            if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card && currency === transaction_enum_1.WalletEnum.NGN) {
                const transactionPayload = {
                    userId,
                    amount: Math.ceil(Number(amount)),
                    type: transaction_enum_1.TransactionType.DEBIT,
                    description: `Verification payment via card`,
                    paymentMethod: paymentMethod,
                    currency: currency,
                    status: transaction_enum_1.TransactionEnum.pending,
                    reference: `PS-${Date.now()}`,
                    serviceType: transaction_enum_1.ServiceEnum.verification,
                    verificationId,
                };
                const transaction = await transactionService.createTransaction(transactionPayload);
                transaction.paymentService = transaction_enum_1.PaymentServiceEnum.paystack;
                await transaction.save();
                const paymentLink = await (0, paystack_1.generatePaystackPaymentLink)(transaction.reference, Number(amount), req.user.email);
                data = { paymentLink, transaction };
            }
        }
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    catch (error) {
        console.log(error);
    }
});
// VERIFY PAYSTACK SERVICE
exports.verifyPaystackPaymentController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { reference } = req.params;
    const transaction = await transactionService.fetchTransactionByReference(reference);
    let message;
    if (!transaction) {
        throw new error_1.NotFoundError("Transaction not found!");
    }
    ;
    if (transaction.serviceType === transaction_enum_1.ServiceEnum.job) {
        const job = await jobService.fetchJobById(transaction.jobId);
        if (!job) {
            throw new error_1.NotFoundError("Job Not found");
        }
        const milestone = job.milestones.find((milestone) => milestone._id.toString() === transaction.milestoneId.toString());
        if (!milestone) {
            throw new error_1.NotFoundError("No milestone");
        }
        const verifyPayment = await (0, paystack_1.verifyPaystackPayment)(reference);
        if (verifyPayment === "success") {
            await jobService.updateMilestone(transaction.jobId, transaction.milestoneId, {
                paymentStatus: jobs_enum_1.MilestonePaymentStatus.processing,
                paymentInfo: {
                    amountPaid: transaction.amount,
                    paymentMethod: transaction_enum_1.PaymentMethodEnum.card,
                    date: new Date(),
                },
            });
            transaction.status = transaction_enum_1.TransactionEnum.processing;
            transaction.dateCompleted = new Date();
            await transaction.save();
            // job.markModified('milestones');
            await job.save();
            message = "Payment successfully";
        }
        else {
            transaction.status = transaction_enum_1.TransactionEnum.failed;
            message = "Payment failed";
            await transaction.save();
        }
    }
    else if (transaction.serviceType === transaction_enum_1.ServiceEnum.material) {
        const cart = await cartService.fetchCartByIdPayment(transaction.cartId, String(transaction.userId));
        if (!cart) {
            throw new error_1.NotFoundError("Cart not found or unauthorized access");
        }
        ;
        const order = await orderService.fetchOrderByCartId(String(cart._id));
        if (!order) {
            throw new error_1.NotFoundError("Your order cannot be found");
        }
        const verifyPayment = await (0, paystack_1.verifyPaystackPayment)(reference);
        if (verifyPayment == "success") {
            cart.isPaid = true;
            cart.status = cart_enum_1.CartStatus.checkedOut;
            await cart.save();
            transaction.status = transaction_enum_1.TransactionEnum.completed;
            transaction.dateCompleted = new Date();
            await transaction.save();
            order.paymentStatus = order_enum_1.OrderPaymentStatus.paid;
            await order.save();
            message = "Payment successfully";
        }
        else {
            transaction.status = transaction_enum_1.TransactionEnum.failed;
            message = "Payment failed";
            await transaction.save();
        }
    }
    else if (transaction.serviceType === transaction_enum_1.ServiceEnum.walletFunding) {
        const wallet = await walletService.findWallet(String(transaction.userId), transaction.currency, transaction.walletId);
        if (!wallet) {
            throw new error_1.NotFoundError("Wallet not found!");
        }
        ;
        let message;
        const verifyPayment = await (0, paystack_1.verifyPaystackPayment)(reference);
        if (verifyPayment == "success") {
            transaction.dateCompleted = new Date();
            transaction.status = transaction_enum_1.TransactionEnum.completed;
            transaction.balanceAfter = wallet.balance + transaction.amount;
            await Promise.all([transaction.save(), walletService.fundWallet(String(transaction.walletId), transaction.amount)]);
            message = "Wallet funded successfully";
        }
        else {
            transaction.status = transaction_enum_1.TransactionEnum.failed;
            message = "Wallet funding failed";
            await transaction.save();
        }
    }
    else if (transaction.serviceType === transaction_enum_1.ServiceEnum.subscription) {
        const plan = await planService.getPlanById(transaction.planId);
        if (!plan) {
            throw new error_1.NotFoundError("Plan not found");
        }
        const user = await userService.findUserById(String(transaction.userId));
        if (!user) {
            throw new error_1.NotFoundError("User not found");
        }
        const verifyPayment = await (0, paystack_1.verifyPaystackPayment)(reference);
        if (verifyPayment == "success") {
            transaction.dateCompleted = new Date();
            transaction.status = transaction_enum_1.TransactionEnum.completed;
            await transaction.save();
            const startDate = new Date();
            let endDate = new Date();
            endDate.setDate(startDate.getDate() + plan.duration);
            if (transaction.durationType === suscribtion_enum_1.SubscriptionPeriodEnum.yearly) {
                endDate.setFullYear(startDate.getFullYear() + 1);
            }
            else {
                endDate.setMonth(startDate.getMonth() + 1);
            }
            message = await subscriptionService.createSubscription({
                userId: transaction.userId,
                planId: transaction.planId,
                perks: plan.perks,
                startDate,
                endDate,
                subscriptionPeriod: transaction.durationType,
            });
            user.subscription = message._id;
            const subscription = await subscriptionService.getActiveSubscriptionWithoutDetails(String(transaction.userId));
            subscription.status = suscribtion_enum_1.SubscriptionStatusEnum.expired;
            await subscription.save();
            await user.save();
        }
        else {
            transaction.status = transaction_enum_1.TransactionEnum.failed;
            message = "Subscription payment failed";
            await transaction.save();
        }
    }
    else if (transaction.serviceType === transaction_enum_1.ServiceEnum.verification) {
        const verification = await verificationService.findById(transaction.verificationId);
        if (!verification) {
            throw new error_1.NotFoundError('verification not found');
        }
        const verifyPayment = await (0, paystack_1.verifyPaystackPayment)(reference);
        if (verifyPayment == "success") {
            transaction.dateCompleted = new Date();
            transaction.status = transaction_enum_1.TransactionEnum.completed;
            await transaction.save();
            verification.paymentStatus = order_enum_1.OrderPaymentStatus.paid;
            await verification.save();
        }
        else {
            transaction.status = transaction_enum_1.TransactionEnum.failed;
            message = "Verification payment failed";
            await transaction.save();
        }
    }
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, message);
});
