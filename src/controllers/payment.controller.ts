import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as productService from "../services/product.service";
import * as cartService from "../services/cart.service";
import * as walletService from "../services/wallet.services";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/error";
import { PaymentMethodEnum, PaymentServiceEnum, ServiceEnum, TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import * as transactionService from "../services/transaction.service";
import { generatePaystackPaymentLink, verifyPaystackPayment } from "../utils/paystack";
import { CartStatus } from "../enums/cart.enum";
import * as jobService from "../services/job.service";
import { MilestonePaymentStatus } from "../enums/jobs.enum";
import * as  projectService from "../services/project.service";
import * as orderService from '../services/order.service';
import { OrderPaymentStatus } from "../enums/order.enum";
import * as planService from '../services/plan.service';
import * as subscriptionService from '../services/subscription.service';
import * as userService from '../services/auth.service';
import { SubscriptionPeriodEnum, SubscriptionStatusEnum } from "../enums/suscribtion.enum";
import { calculateVat } from "../utils/utility";
import * as verificationService from "../services/verification.service";

export const payforProductController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {cartId, paymentMethod, currency} = req.body;
    let data;

    const cart = await cartService.fetchCartByIdPayment(cartId, userId);
    if(!cart ){
        throw new NotFoundError("Cart not found");
    };
    if(cart.userId?.toString() !== userId.toString()){
      throw new UnauthorizedError("Unauthorized access!");

    }
    const order = await orderService.fetchOrderByCartId(cartId);
    if(!order){
      throw new NotFoundError("Your order cannot be found");
    }

    const {vatAmount,totalAmount } = await calculateVat(order.totalAmount!);

    for (const item of cart.products!) {
      const product = item.productId as any; 
      if (product.availableQuantity < item.quantity) {
        throw new BadRequestError(`Insufficient stock for ${product.name}` );
      }
    }
      if (paymentMethod === PaymentMethodEnum.wallet) {
        const userWallet = await walletService.findUserWalletByCurrency(userId, currency);
        if (!userWallet || userWallet.balance < totalAmount) {
           throw new BadRequestError("Insufficient wallet balance" );
        }
        const transactionPayload = {
            userId,
            type: TransactionType.DEBIT,
            amount:totalAmount,
            description: `Product payment via wallet`,
            paymentMethod: paymentMethod,
            balanceBefore: userWallet.balance,
            walletId: userWallet._id,
            currency: userWallet.currency,
            status: TransactionEnum.completed,
            cartId: cart._id,
            orderId: order._id,
            serviceType: ServiceEnum.material,
            vat: vatAmount,
          };
        const transaction = await transactionService.createTransaction(transactionPayload);
        userWallet.balance -= totalAmount;
        await userWallet.save();
        transaction.balanceAfter = userWallet.balance;
        await transaction.save();
          cart.isPaid = true;
          order.paymentStatus = OrderPaymentStatus.paid;
          await order.save();
          cart.status = CartStatus.checkedOut;
         await cart.save();
         data = "Payment successful"
      } else if (paymentMethod === PaymentMethodEnum.card) {
        if (paymentMethod === PaymentMethodEnum.card && currency === WalletEnum.NGN ) {
            const transactionPayload = {
                userId,
                type: TransactionType.DEBIT,
                amount:totalAmount,
                description: `Product payment via card`,
                paymentMethod: paymentMethod,
                currency: currency,
                status: TransactionEnum.pending,
                reference:`PS-${Date.now()}`,
                cartId: cart._id,
                orderId: order._id,
                serviceType: ServiceEnum.material,
                vat: vatAmount,
              };
            const transaction = await transactionService.createTransaction(transactionPayload);
            transaction.paymentService = PaymentServiceEnum.paystack;
            await transaction.save();
            const paymentLink = await generatePaystackPaymentLink(transaction.reference, cart.totalAmount!, req.user.email);
            data = { paymentLink, transaction };
      }
    }
    return successResponse(res, StatusCodes.CREATED, data);
  }   
);

export const payforJobController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const {paymentMethod, currency, milestoneId, jobId, note, isAdditionalAmount} = req.body;
  let data;
const job = await jobService.fetchJobById(jobId);
if(!job){
  throw new NotFoundError("Job Not found");
}
const milestone = job.milestones.find((milestone: any)=> milestone._id.toString()  === milestoneId);
if(!milestone){
  throw new NotFoundError("No milestone");
}
if(milestone.paymentStatus !== MilestonePaymentStatus.unpaid){
  throw new BadRequestError("Job has been paid")
}
if(note){
  milestone.paymentInfo.note = note;
  await job.save();
}
let jobAmount = milestone.amount;

if(isAdditionalAmount){
  if(milestone.invoice.additionalAmount > 0){
    jobAmount+= milestone.invoice.additionalAmount;
  }
};
const project = await projectService.fetchProjectById(String(job.acceptedApplicationId));
if(!project){
  throw new NotFoundError("Application not found");
}
// const {vatAmount,totalAmount } = await calculateVat(milestone.amount);

    if (paymentMethod === PaymentMethodEnum.wallet) {
      const userWallet = await walletService.findUserWalletByCurrency(userId, currency);
      console.log(userWallet)

      if (!userWallet || userWallet.balance < milestone.amount) {
         throw new BadRequestError("Insufficient wallet balance" );
      }
      const transactionPayload = {
          userId,
          type: TransactionType.DEBIT,
          amount: jobAmount,
          description: `Job payment via wallet`,
          paymentMethod: paymentMethod,
          balanceBefore: userWallet.balance,
          walletId: userWallet._id,
          currency: userWallet.currency,
          status: TransactionEnum.processing,
          jobId,
          milestoneId,
          recieverId: project.user, 
          serviceType: ServiceEnum.job,
          // vat: vatAmount,
        };
      const transaction = await transactionService.createTransaction(transactionPayload);
      userWallet.balance -= Math.ceil(jobAmount);
      await userWallet.save();
      transaction.balanceAfter = userWallet.balance;
      await jobService.updateMilestone(
        transaction.jobId!,
        transaction.milestoneId!,
        {
          paymentStatus: MilestonePaymentStatus.processing,
          paymentInfo: {
            amountPaid: transaction.amount,
            paymentMethod: PaymentMethodEnum.wallet,
            date: new Date(),
          },
        }
      );
      // job.markModified('milestones');
      await job.save();
       data = "Payment successful";
    } else if (paymentMethod === PaymentMethodEnum.card) {
      if (paymentMethod === PaymentMethodEnum.card && currency === WalletEnum.NGN ) {
          const transactionPayload = {
              userId,
              amount: Math.ceil(jobAmount),
              type: TransactionType.DEBIT,
              description: `Job payment via card`,
              paymentMethod: paymentMethod,
              currency: currency,
              status: TransactionEnum.pending,
              reference:`PS-${Date.now()}`,
              jobId,
              milestoneId,
              recieverId: project.user, 
              serviceType: ServiceEnum.job,
              // vat: vatAmount,
             };
          const transaction = await transactionService.createTransaction(transactionPayload);
          transaction.paymentService = PaymentServiceEnum.paystack;
          await transaction.save();
          const paymentLink = await generatePaystackPaymentLink(transaction.reference, jobAmount, req.user.email);
          data = { paymentLink, transaction };
    }
  }
  return successResponse(res, StatusCodes.CREATED, data);
}   
);

export const payforVerificationController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const {paymentMethod, currency, certificateId, type, businessId, verificationId} = req.body;
  let data;
      const appConfig = await transactionService.fetchPriceForVerification();
  let amount;
    if(type === 'user'){
       amount = appConfig?.userVerificationPrice;
    }else if( type === 'certificate' && certificateId && businessId){
       amount = appConfig?.certificateVerificationPrice;

    }else if (type === 'business' && businessId){
       amount = appConfig?.businessVerificationPrice;

    }
    if (paymentMethod === PaymentMethodEnum.wallet) {
      const userWallet = await walletService.findUserWalletByCurrency(userId, currency);
      if (!userWallet || userWallet.balance < amount!) {
         throw new BadRequestError("Insufficient wallet balance" );
      }
      const transactionPayload = {
          userId,
          type: TransactionType.DEBIT,
          amount: amount,
          description: `Verification payment via wallet`,
          paymentMethod: paymentMethod,
          balanceBefore: userWallet.balance,
          walletId: userWallet._id,
          currency: userWallet.currency,
          status: TransactionEnum.processing,
          certificateId,
          businessId,
          serviceType: ServiceEnum.verification,
          verificationId,
        };
      const transaction = await transactionService.createTransaction(transactionPayload);
      userWallet.balance -= Math.ceil(Number(amount));
      await userWallet.save();
      transaction.balanceAfter = userWallet.balance;
      await verificationService.updateVerification(
          verificationId,
        {
          paymentStatus: OrderPaymentStatus.paid,
          
        }
      );

       data = "Payment successful";
    } else if (paymentMethod === PaymentMethodEnum.card) {
      if (paymentMethod === PaymentMethodEnum.card && currency === WalletEnum.NGN ) {
          const transactionPayload = {
              userId,
              amount: Math.ceil(Number(amount)),
              type: TransactionType.DEBIT,
              description: `Verification payment via card`,
              paymentMethod: paymentMethod,
              currency: currency,
              status: TransactionEnum.pending,
              reference:`PS-${Date.now()}`,
              certificateId,
              businessId,
              serviceType: ServiceEnum.verification,
              verificationId,
             };
          const transaction = await transactionService.createTransaction(transactionPayload);
          transaction.paymentService = PaymentServiceEnum.paystack;
          await transaction.save();
          const paymentLink = await generatePaystackPaymentLink(transaction.reference, Number(amount), req.user.email);
          data = { paymentLink, transaction };
    }
  }
  return successResponse(res, StatusCodes.CREATED, data);
}   
);

// VERIFY PAYSTACK SERVICE
export const verifyPaystackPaymentController=  catchAsync(async (req: JwtPayload, res: Response) => {
  const {reference} = req.params;
  const transaction = await transactionService.fetchTransactionByReference(reference);
  let message;

  if(!transaction){
    throw new NotFoundError("Transaction not found!");
  };
  if(transaction.serviceType === ServiceEnum.job){
    const job = await jobService.fetchJobById(transaction.jobId!);
    if(!job){
      throw new NotFoundError("Job Not found");
    }
    const milestone = job.milestones.find((milestone: any)=> milestone._id.toString()  === transaction.milestoneId.toString());
    if(!milestone){
      throw new NotFoundError("No milestone");
    }
  
    const verifyPayment = await  verifyPaystackPayment(reference);
    if(verifyPayment === "success"){
   await jobService.updateMilestone(
        transaction.jobId!,
        transaction.milestoneId!,
        {
          paymentStatus: MilestonePaymentStatus.processing,
          paymentInfo: {
            amountPaid: transaction.amount,
            paymentMethod: PaymentMethodEnum.card,
            date: new Date(),
          },
        }
      );
      transaction.status = TransactionEnum.processing;
      transaction.dateCompleted = new Date();
      await transaction.save();
      // job.markModified('milestones');
      await job.save();
      message = "Payment successfully";
    }else {
      transaction.status = TransactionEnum.failed;
      message = "Payment failed";
      await transaction.save();
    }
  }else if(transaction.serviceType === ServiceEnum.material){
    const cart = await cartService.fetchCartByIdPayment(transaction.cartId!, String(transaction.userId));
    if(!cart){
      throw new NotFoundError("Cart not found or unauthorized access");
    };
    const order = await orderService.fetchOrderByCartId(String(cart._id));
    if(!order){
    throw new NotFoundError("Your order cannot be found");
    }
    const verifyPayment = await  verifyPaystackPayment(reference);
    if(verifyPayment == "success"){
      cart.isPaid = true;
      cart.status = CartStatus.checkedOut;
      await cart.save();
      transaction.status = TransactionEnum.completed;
      transaction.dateCompleted = new Date();
      await transaction.save();
      order.paymentStatus = OrderPaymentStatus.paid;
      await order.save();
      message = "Payment successfully";
  }else {
      transaction.status = TransactionEnum.failed;
      message = "Payment failed";
      await transaction.save();
  }
  }else if(transaction.serviceType === ServiceEnum.walletFunding){
    const wallet = await walletService.findWallet(String(transaction.userId), transaction.currency, transaction.walletId);
    if(!wallet){
      throw new NotFoundError("Wallet not found!")
    };
    let message;
    const verifyPayment = await  verifyPaystackPayment(reference);
    if(verifyPayment == "success"){
      transaction.dateCompleted = new Date();
      transaction.status = TransactionEnum.completed;
      transaction.balanceAfter = wallet.balance + transaction.amount;
      await Promise.all([ transaction.save(), walletService.fundWallet(String(transaction.walletId), transaction.amount)]);
      message = "Wallet funded successfully"
    }else {
      transaction.status = TransactionEnum.failed;
      message = "Wallet funding failed"
      await transaction.save();
    }
  }else if(transaction.serviceType === ServiceEnum.subscription){
    const plan = await planService.getPlanById(transaction.planId!);
    if(!plan){
      throw new NotFoundError("Plan not found");
    }
    const user = await userService.findUserById(String(transaction.userId!));
    if(!user){
      throw new NotFoundError("User not found");
    }
    const verifyPayment = await verifyPaystackPayment(reference);
    if(verifyPayment == "success"){
      transaction.dateCompleted = new Date();
      transaction.status = TransactionEnum.completed;
      await transaction.save();
      const startDate = new Date();
      let endDate = new Date();
      endDate.setDate(startDate.getDate() + plan.duration);
      if(transaction.durationType === SubscriptionPeriodEnum.yearly){
        endDate.setFullYear(startDate.getFullYear() + 1);
      }else{
        endDate.setMonth(startDate.getMonth() + 1); 
      }
        message =  await subscriptionService.createSubscription({
        userId: transaction.userId,
        planId: transaction.planId,
        perks: plan.perks,
        startDate,
        endDate,
        subscriptionPeriod: transaction.durationType,
      });
      user.subscription = message._id;
      const subscription = await subscriptionService.getActiveSubscriptionWithoutDetails(String(transaction.userId));   
      subscription!.status = SubscriptionStatusEnum.expired;
      await subscription!.save();
     await user.save();
    }else {
      transaction.status = TransactionEnum.failed;
      message = "Subscription payment failed"
      await transaction.save();
    }
  }else if(transaction.serviceType === ServiceEnum.verification){
    const verification = await verificationService.findById(transaction.verificationId)
    if(!verification){
      throw new NotFoundError('verification not found')
    }
    const verifyPayment = await verifyPaystackPayment(reference);

    if(verifyPayment == "success"){
      transaction.dateCompleted = new Date();
      transaction.status = TransactionEnum.completed;
      await transaction.save();
      verification.paymentStatus = OrderPaymentStatus.paid;
      await verification.save();
    }else {
      transaction.status = TransactionEnum.failed;
      message = "Verification payment failed"
      await transaction.save();
    }
  }

  return successResponse(res, StatusCodes.OK, message);
});

