import { Request, Response } from 'express';
import { ObjectId } from 'mongoose';
import * as planService from '../services/plan.service';
import * as subscriptionService from '../services/subscription.service';
import { JwtPayload } from 'jsonwebtoken';
import { catchAsync } from '../errors/error-handler';
import { BadRequestError, NotFoundError } from '../errors/error';
import { StatusCodes } from 'http-status-codes';
import { successResponse } from '../helpers/success-response';
import { PaymentMethodEnum, PaymentServiceEnum, ServiceEnum, TransactionEnum, TransactionType } from '../enums/transaction.enum';
import * as walletService from '../services/wallet.services';
import { CartStatus } from '../enums/cart.enum';
import { OrderPaymentStatus } from '../enums/order.enum';
import * as transactionService from '../services/transaction.service';
import { generatePaystackPaymentLink } from '../utils/paystack';
import { PlanEnum } from '../enums/plan.enum';

export const subscribeToPlan = catchAsync( async (req:JwtPayload, res: Response) => {
    const { planId, paymentMethod, currency, isRenew, durationType } = req.body;
    const userId = req.user._id;
    let plan;
    let currentPlan;
    if(isRenew){
        console.log('here')
        const subscription = await subscriptionService.getActiveSubscriptionWithoutDetails(userId);
        if(!subscription) throw new BadRequestError('You do not have an active subscription');

        plan = await planService.getPlanById(String(subscription.planId)); 
        if (!plan) throw new NotFoundError('Plan not found');
        if(plan.name === PlanEnum.basic) throw new BadRequestError('You cannot renew a free plan');
    }else {
        plan = await planService.getPlanById(planId);
    if (!plan) throw new NotFoundError('Plan not found');
    const subscription = await subscriptionService.getActiveSubscription(userId);   
    currentPlan = await planService.getPlanById(String(subscription?.planId));

    if(subscription && currentPlan?.name !== PlanEnum.basic) throw new BadRequestError('You already have an active subscription');
    }
    let data;
    const startDate = new Date();
    let endDate = new Date();
    if (durationType === 'yearly') {
        endDate.setFullYear(startDate.getFullYear() + 1);  
    } else if(durationType === 'monthly') {
        endDate.setMonth(startDate.getMonth() + 1);  
    };
    currentPlan!.isActive = false;
    await currentPlan!.save();
    if (paymentMethod === PaymentMethodEnum.wallet) {
        const userWallet = await walletService.findUserWalletByCurrency(userId, currency);
        if (!userWallet || userWallet.balance < plan.price) {
           throw new BadRequestError("Insufficient wallet balance" );
        }
        const transactionPayload = {
            userId,
            type: TransactionType.DEBIT,
            amount:plan.price,
            description: `Subscription payment via wallet`,
            paymentMethod: paymentMethod,
            balanceBefore: userWallet.balance,
            walletId: userWallet._id,
            currency: userWallet.currency,
            status: TransactionEnum.completed,
            serviceType: ServiceEnum.subscription,
            planId: plan._id,
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
        });
        return  successResponse(res,StatusCodes.CREATED, data);

    }else if (paymentMethod === PaymentMethodEnum.card) {
        if (paymentMethod === PaymentMethodEnum.card) {
            const transactionPayload = {
                userId,
                type: TransactionType.DEBIT,
                amount: plan.price,
                description: `Subscription payment via card`,
                paymentMethod: paymentMethod,
                currency: currency,
                status: TransactionEnum.pending,
                reference:`PS-${Date.now()}`,
                serviceType: ServiceEnum.subscription,
                planId: plan._id,
              };
            const transaction = await transactionService.createTransaction(transactionPayload);
            transaction.paymentService = PaymentServiceEnum.paystack;
            await transaction.save();
            const paymentLink = await generatePaystackPaymentLink(transaction.reference, plan.price!, req.user.email);
            data = { paymentLink, transaction };
      }
     
      return  successResponse(res,StatusCodes.CREATED, data);
    }

});

export const getUserSubscription = catchAsync( async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;

    const data = await subscriptionService.getActiveSubscription(userId);

    if (!data) throw new NotFoundError('Subscription not found');

return successResponse(res, StatusCodes.OK, data);
});

