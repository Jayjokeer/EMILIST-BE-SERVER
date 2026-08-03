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
exports.getAllUsersSubscription = exports.promoteJobAndBusinessController = exports.getUserSubscription = exports.subscribeToPlan = void 0;
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
const jobService = __importStar(require("../services/job.service"));
const businessService = __importStar(require("../services/business.service"));
const productService = __importStar(require("../services/product.service"));
exports.subscribeToPlan = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { planId, paymentMethod, currency, isRenew, durationType, redirectUrl } = req.body;
    const userId = req.user._id;
    let plan;
    let currentPlan;
    let subscription;
    const user = await userService.findUserWithoutDetailsById(userId);
    if (isRenew) {
        subscription = await subscriptionService.getActiveSubscriptionWithoutDetails(userId);
        if (!subscription)
            throw new error_1.BadRequestError('You do not have an active subscription');
        plan = await planService.getPlanById(String(subscription.planId));
        if (!plan)
            throw new error_1.NotFoundError('Plan not found');
        if (plan.name === plan_enum_1.PlanEnum.basic)
            throw new error_1.BadRequestError('You cannot renew a free plan');
    }
    else {
        plan = await planService.getPlanById(planId);
        if (!plan)
            throw new error_1.NotFoundError('Plan not found');
        subscription = await subscriptionService.getActiveSubscriptionWithoutDetails(userId);
        currentPlan = await planService.getPlanById(String(subscription?.planId));
        if (subscription && currentPlan?.name !== plan_enum_1.PlanEnum.basic)
            throw new error_1.BadRequestError('You already have an active subscription');
    }
    ;
    let data;
    const startDate = new Date();
    let endDate = new Date();
    let price;
    let period;
    if (durationType === 'yearly') {
        endDate.setFullYear(startDate.getFullYear() + 1);
        price = plan.price * 12;
        period = suscribtion_enum_1.SubscriptionPeriodEnum.yearly;
    }
    else if (durationType === 'monthly') {
        endDate.setMonth(startDate.getMonth() + 1);
        price = plan.price;
        period = suscribtion_enum_1.SubscriptionPeriodEnum.monthly;
    }
    ;
    if (paymentMethod === transaction_enum_1.PaymentMethodEnum.wallet) {
        const userWallet = await walletService.findUserWalletByCurrency(userId, currency);
        if (!userWallet || userWallet.balance < plan.price) {
            throw new error_1.BadRequestError("Insufficient wallet balance");
        }
        const transactionPayload = {
            userId,
            type: transaction_enum_1.TransactionType.DEBIT,
            amount: price,
            description: `Subscription payment via wallet`,
            paymentMethod: paymentMethod,
            balanceBefore: userWallet.balance,
            walletId: userWallet._id,
            currency: userWallet.currency,
            status: transaction_enum_1.TransactionEnum.completed,
            serviceType: transaction_enum_1.ServiceEnum.subscription,
            planId: plan._id,
            durationType: period,
        };
        const transaction = await transactionService.createTransaction(transactionPayload);
        userWallet.balance -= plan.price;
        await userWallet.save();
        transaction.balanceAfter = userWallet.balance;
        await transaction.save();
        data = await subscriptionService.createSubscription({
            userId,
            planId,
            perks: plan.perks,
            startDate,
            endDate,
            subscriptionPeriod: period,
        });
        user.subscription = data._id;
        await user.save();
        subscription.status = suscribtion_enum_1.SubscriptionStatusEnum.expired;
        await subscription.save();
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
    else if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card) {
        if (paymentMethod === transaction_enum_1.PaymentMethodEnum.card) {
            if (!redirectUrl) {
                throw new error_1.BadRequestError("redirectUrl is required for card payments");
            }
            const transactionPayload = {
                userId,
                type: transaction_enum_1.TransactionType.DEBIT,
                amount: price,
                description: `Subscription payment via card`,
                paymentMethod: paymentMethod,
                currency: currency,
                status: transaction_enum_1.TransactionEnum.pending,
                reference: `PS-${Date.now()}`,
                serviceType: transaction_enum_1.ServiceEnum.subscription,
                planId: plan._id,
                durationType: period,
            };
            const transaction = await transactionService.createTransaction(transactionPayload);
            transaction.paymentService = transaction_enum_1.PaymentServiceEnum.paystack;
            await transaction.save();
            const paymentLink = await (0, paystack_1.generatePaystackPaymentLink)(transaction.reference, price, req.user.email, redirectUrl);
            data = { paymentLink, transaction };
        }
        return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.CREATED, data);
    }
});
exports.getUserSubscription = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const data = await subscriptionService.getActiveSubscription(userId);
    if (!data)
        throw new error_1.NotFoundError('Subscription not found');
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
exports.promoteJobAndBusinessController = (0, error_handler_1.catchAsync)(async (req, res) => {
    const { target, type, durationDays, expectedClicks } = req.body;
    const { id } = req.params;
    const userId = req.user._id;
    if (!['job', 'service', 'product'].includes(type)) {
        throw new error_1.BadRequestError('type must be one of: job, service, product.');
    }
    const payload = {
        userId,
        target,
        type,
        isActive: false, // stays inactive until payment is confirmed
    };
    // ---- RESOLVE TARGET ENTITY + OWNERSHIP CHECK ----
    // Previously nothing verified the caller owns the thing being promoted —
    // any authenticated user could pass someone else's id here.
    if (type === 'job') {
        const job = await jobService.fetchJobById(id);
        if (!job)
            throw new error_1.NotFoundError('Job not found.');
        if (job.userId.toString() !== userId.toString()) {
            throw new error_1.ForbiddenError('You can only promote your own job listings.');
        }
        payload.jobId = job._id;
    }
    else if (type === 'service') {
        const business = await businessService.fetchSingleBusiness(id);
        if (!business)
            throw new error_1.NotFoundError('Service not found');
        if (business.userId?.toString() !== userId.toString()) {
            throw new error_1.ForbiddenError('You can only promote your own business listings.');
        }
        payload.businessId = business._id;
    }
    else {
        const product = await productService.fetchProductById(id);
        if (!product)
            throw new error_1.NotFoundError('Product not found');
        if (product.userId.toString() !== userId.toString()) {
            throw new error_1.ForbiddenError('You can only promote your own product listings.');
        }
        payload.productId = product._id;
    }
    if (type === 'product') {
        if (!suscribtion_enum_1.PROMOTION_PLAN_DURATIONS.includes(durationDays)) {
            throw new error_1.BadRequestError(`durationDays must be one of: ${suscribtion_enum_1.PROMOTION_PLAN_DURATIONS.join(', ')}`);
        }
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);
        const costPerDay = await subscriptionService.fetchCostPerDay();
        const cost = costPerDay * durationDays;
        payload.startDate = startDate;
        payload.endDate = endDate;
        payload.durationDays = durationDays;
        payload.costPerDay = costPerDay;
        payload.cost = cost;
        payload.clicks = 0; // actual clicks — always starts at zero
    }
    else {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            throw new error_1.BadRequestError('startDate and endDate are required for this promotion type.');
        }
        if (!expectedClicks || expectedClicks <= 0) {
            throw new error_1.BadRequestError('expectedClicks must be a positive number.');
        }
        const costPerClick = await subscriptionService.fetchCostPerClick();
        const cost = costPerClick * expectedClicks;
        payload.startDate = startDate;
        payload.endDate = endDate;
        payload.expectedClicks = expectedClicks; // the click budget being bid for
        payload.costPerClick = costPerClick;
        payload.cost = cost;
        payload.clicks = 0; // actual clicks received — separate from the budget above
    }
    const promotion = await subscriptionService.createPromotion(payload);
    // Promotion is created inactive/pending — the frontend's "Create Campaign"
    // button should hand off to your payment flow here (the layer tree shows
    // "Payment Successful"/"Payment Failed" screens, implying a payment step
    // happens after this call). Whatever confirms payment should be the thing
    // that sets isActive: true and paymentStatus: success — not this endpoint.
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, promotion);
});
exports.getAllUsersSubscription = (0, error_handler_1.catchAsync)(async (req, res) => {
    const userId = req.user._id;
    const data = await subscriptionService.getAllUsersSubscription(userId);
    if (!data)
        throw new error_1.NotFoundError('Subscriptions not found');
    return (0, success_response_1.successResponse)(res, http_status_codes_1.StatusCodes.OK, data);
});
