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
exports.getUserSubscription = exports.subscribeToPlan = void 0;
const planService = __importStar(require("../services/plan.service"));
const subscriptionService = __importStar(require("../services/subscription.service"));
const error_handler_1 = require("../errors/error-handler");
const error_1 = require("../errors/error");
const http_status_codes_1 = require("http-status-codes");
const success_response_1 = require("../helpers/success-response");
const transaction_enum_1 = require("../enums/transaction.enum");
const walletService = __importStar(require("../services/wallet.services"));
const transactionService = __importStar(require("../services/transaction.service"));
const paystack_1 = require("../utils/paystack");
const plan_enum_1 = require("../enums/plan.enum");
const suscribtion_enum_1 = require("../enums/suscribtion.enum");
const userService = __importStar(require("../services/auth.service"));
exports.subscribeToPlan = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { planId, paymentMethod, currency, isRenew, durationType } = req.body;
    const userId = req.user._id;
    let plan;
    let currentPlan;
    let subscription;
    const user = yield userService.findUserWithoutDetailsById(userId);
    if (isRenew) {
        subscription = yield subscriptionService.getActiveSubscriptionWithoutDetails(userId);
        if (!subscription)
            throw new error_1.BadRequestError('You do not have an active subscription');
        plan = yield planService.getPlanById(String(subscription.planId));
        if (!plan)
            throw new error_1.NotFoundError('Plan not found');
        if (plan.name === plan_enum_1.PlanEnum.basic)
            throw new error_1.BadRequestError('You cannot renew a free plan');
    }
    else {
        plan = yield planService.getPlanById(planId);
        if (!plan)
            throw new error_1.NotFoundError('Plan not found');
        subscription = yield subscriptionService.getActiveSubscriptionWithoutDetails(userId);
        currentPlan = yield planService.getPlanById(String(subscription === null || subscription === void 0 ? void 0 : subscription.planId));
        if (subscription && (currentPlan === null || currentPlan === void 0 ? void 0 : currentPlan.name) !== plan_enum_1.PlanEnum.basic)
            throw new error_1.BadRequestError('You already have an active subscription');
    }
    ;
    let data;
    const startDate = new Date();
    let endDate = new Date();
    if (durationType === 'yearly') {
        endDate.setFullYear(startDate.getFullYear() + 1);
    }
    else if (durationType === 'monthly') {
        endDate.setMonth(startDate.getMonth() + 1);
    }
    ;
    if (paymentMethod === transaction_enum_1.PaymentMethodEnum.wallet) {
        const userWallet = yield walletService.findUserWalletByCurrency(userId, currency);
        if (!userWallet || userWallet.balance < plan.price) {
            throw new error_1.BadRequestError("Insufficient wallet balance");
        }
        const transactionPayload = {
            userId,
            type: transaction_enum_1.TransactionType.DEBIT,
            amount: plan.price,
            description: `Subscription payment via wallet`,
            paymentMethod: paymentMethod,
            balanceBefore: userWallet.balance,
            walletId: userWallet._id,
            currency: userWallet.currency,
            status: transaction_enum_1.TransactionEnum.completed,
            serviceType: transaction_enum_1.ServiceEnum.subscription,
            planId: plan._id,
        };
        const transaction = yield transactionService.createTransaction(transactionPayload);
        userWallet.balance -= plan.price;
        yield userWallet.save();
        transaction.balanceAfter = userWallet.balance;
        yield transaction.save();
        data = yield subscriptionService.createSubscription({
            userId,
            planId,
            perks: plan.perks,
            startDate,
            endDate,
        });
        user.subscription = data._id;
        yield user.save();
        subscription.status = suscribtion_enum_1.SubscriptionStatusEnum.expired;
        yield subscription.save();
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    else if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card) {
        if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card) {
            const transactionPayload = {
                userId,
                type: transaction_enum_1.TransactionType.DEBIT,
                amount: plan.price,
                description: `Subscription payment via card`,
                paymentMethod: paymentMethod,
                currency: currency,
                status: transaction_enum_1.TransactionEnum.pending,
                reference: `PS-${Date.now()}`,
                serviceType: transaction_enum_1.ServiceEnum.subscription,
                planId: plan._id,
            };
            const transaction = yield transactionService.createTransaction(transactionPayload);
            transaction.paymentService = transaction_enum_1.PaymentServiceEnum.paystack;
            yield transaction.save();
            const paymentLink = yield (0, paystack_1.generatePaystackPaymentLink)(transaction.reference, plan.price, req.user.email);
            data = { paymentLink, transaction };
        }
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
}));
exports.getUserSubscription = (0, error_handler_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id;
    const data = yield subscriptionService.getActiveSubscription(userId);
    if (!data)
        throw new error_1.NotFoundError('Subscription not found');
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
}));
