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
import { SubscriptionPeriodEnum, SubscriptionStatusEnum } from '../enums/suscribtion.enum';
import * as userService from '../services/auth.service';
import * as jobService from '../services/job.service';
import * as businessService from '../services/business.service';

export const subscribeToPlan = catchAsync( async (req:JwtPayload, res: Response) => {
    const { planId, paymentMethod, currency, isRenew, durationType } = req.body;
    const userId = req.user._id;
    let plan;
    let currentPlan;
    let subscription;
    const user = await userService.findUserWithoutDetailsById(userId);
    if(isRenew){
        subscription = await subscriptionService.getActiveSubscriptionWithoutDetails(userId);
        if(!subscription) throw new BadRequestError('You do not have an active subscription');

        plan = await planService.getPlanById(String(subscription.planId));
        if (!plan) throw new NotFoundError('Plan not found');
        if(plan.name === PlanEnum.basic) throw new BadRequestError('You cannot renew a free plan');
    }else {
        plan = await planService.getPlanById(planId);

    if (!plan) throw new NotFoundError('Plan not found');
    subscription = await subscriptionService.getActiveSubscriptionWithoutDetails(userId); 
    currentPlan = await planService.getPlanById(String(subscription?.planId));
    if(subscription && currentPlan?.name !== PlanEnum.basic) throw new BadRequestError('You already have an active subscription');
    };
    let data;
    const startDate = new Date();
    let endDate = new Date();
    let price;
    let period;
    if (durationType === 'yearly') {
        endDate.setFullYear(startDate.getFullYear() + 1);
        price = plan.price * 12; 
        period = SubscriptionPeriodEnum.yearly;
    } else if(durationType === 'monthly') {
        endDate.setMonth(startDate.getMonth() + 1); 
        price = plan.price; 
        period = SubscriptionPeriodEnum.monthly;
    };
 
    if (paymentMethod === PaymentMethodEnum.wallet) {
        const userWallet = await walletService.findUserWalletByCurrency(userId, currency);
        if (!userWallet || userWallet.balance < plan.price) {
           throw new BadRequestError("Insufficient wallet balance" );
        }
        const transactionPayload = {
            userId,
            type: TransactionType.DEBIT,
            amount: price,
            description: `Subscription payment via wallet`,
            paymentMethod: paymentMethod,
            balanceBefore: userWallet.balance,
            walletId: userWallet._id,
            currency: userWallet.currency,
            status: TransactionEnum.completed,
            serviceType: ServiceEnum.subscription,
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
        user!.subscription = data._id;
        await user!.save();
        subscription!.status = SubscriptionStatusEnum.expired;
        await subscription!.save();
        
        return  successResponse(res,StatusCodes.CREATED, data);

    }else if (paymentMethod === PaymentMethodEnum.card) {
        if (paymentMethod === PaymentMethodEnum.card) {
            const transactionPayload = {
                userId,
                type: TransactionType.DEBIT,
                amount: price,
                description: `Subscription payment via card`,
                paymentMethod: paymentMethod,
                currency: currency,
                status: TransactionEnum.pending,
                reference:`PS-${Date.now()}`,
                serviceType: ServiceEnum.subscription,
                planId: plan._id,
                durationType: period,
              };
            const transaction = await transactionService.createTransaction(transactionPayload);
            transaction.paymentService = PaymentServiceEnum.paystack;
            await transaction.save();
            const paymentLink = await generatePaystackPaymentLink(transaction.reference, price!, req.user.email);
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

export const promoteJobAndBusinessController = catchAsync( async(req:JwtPayload, res: Response)=>{
    const {target, startDate, endDate, type} = req.body;
    const {id }= req.params;
    const userId = req.user._id;

    if(type === "job"){
        const job = await jobService.fetchJobById(id);
        if (!job) {
            throw new NotFoundError( 'Job not found.');
          }
    }else if(type === "service"){
        const business = await businessService.fetchSingleBusiness(id);
        if(!business){
            throw new NotFoundError('Service not found');
        }
    }
    
    

    // 3. Ensure the job belongs to the authenticated user.
    // if (job.userId?.toString() !== user._id.toString()) {
    //   return res.status(403).json({ message: 'Forbidden. You do not own this job.' });
    // }

    if (!target || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required promotion details: target, startDate, endDate.' });
    }

    // 5. Calculate promotion values (these can be dynamic based on your business logic).
    const cost = 11500;          // Example: Fixed cost for the promotion.
    const expectedClicks = 2000; // Example: Expected clicks count.
    const costPerClick = 1;      // Example: Calculated as cost / expectedClicks.

//     // 6. Create a new Promotion document.
//     const promotion = new Promotion({
//       jobId: job._id,
//       userId: userId,
//       target,
//       startDate,
//       endDate,
//       cost,
//       clicks: expectedClicks, // You may update this later based on actual performance.
//       costPerClick,
//       isActive: true,
//       paymentStatus: 'pending'
//     });

//     await promotion.save();
//   return successResponse(res,StatusCodes.OK, data);
  
  
  });