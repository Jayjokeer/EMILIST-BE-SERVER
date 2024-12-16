import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as productService from "../services/product.service";
import * as cartService from "../services/cart.service";
import * as walletService from "../services/wallet.services";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/error";
import { PaymentMethodEnum, PaymentServiceEnum, TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import * as transactionService from "../services/transaction.service";
import { generatePaystackPaymentLink, verifyPaystackPayment } from "../utils/paystack";
import { CartStatus } from "../enums/cart.enum";
import * as jobService from "../services/job.service";
import { MilestonePaymentStatus } from "../enums/jobs.enum";
import * as  projectService from "../services/project.service";
import * as orderService from '../services/order.service';
import { OrderPaymentStatus } from "../enums/order.enum";

export const payforProductController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {cartId, paymentMethod, currency} = req.body;
    let data;

    const cart = await cartService.fetchCartByIdPayment(cartId, userId);
    if(!cart || cart.userId?.toString() !== userId.toString()){
        throw new NotFoundError("Cart not found or unauthorized access");
    };
    const order = await orderService.fetchOrderByCartId(cartId);
    if(!order){
      throw new NotFoundError("Your order cannot be found");
    }


    const totalAmount = order.totalAmount!;

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
          };
        const transaction = await transactionService.createTransaction(transactionPayload);
        userWallet.balance -= totalAmount;
        await userWallet.save();
        transaction.balanceAfter = userWallet.balance;
        await transaction.save();
          cart.isPaid = true;
          order.paymentStatus = OrderPaymentStatus.paid;
          await order.save();
          // cart.status = CartStatus.checkedOut;
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

export const verifyPaystackProductPayment=  catchAsync(async (req: JwtPayload, res: Response) => {
  const {reference} = req.params;
  const transaction = await transactionService.fetchTransactionByReference(reference);
  if(!transaction){
    throw new NotFoundError("Transaction not found!");
  };
  const cart = await cartService.fetchCartByIdPayment(transaction.cartId!, String(transaction.userId));
  if(!cart){
      throw new NotFoundError("Cart not found or unauthorized access");
  };
  const order = await orderService.fetchOrderByCartId(String(cart._id));
  if(!order){
    throw new NotFoundError("Your order cannot be found");
  }
  let message;
  const verifyPayment = await  verifyPaystackPayment(reference);
  if(verifyPayment == "success"){
    cart.isPaid = true;
    // cart.status = CartStatus.checkedOut;
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
  return successResponse(res, StatusCodes.OK, message);
});

export const payforJobController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const {paymentMethod, currency, milestoneId, jobId, note} = req.body;
  let data;
const job = await jobService.fetchJobById(jobId);
if(!job){
  throw new NotFoundError("Job Not found");
}
const milestone = job.milestones.find((milestone: any)=> milestone._id.toString()  === milestoneId);
if(!milestone){
  throw new NotFoundError("No milestone");
}
milestone.paymentInfo.note = note;
await job.save();

const project = await projectService.fetchProjectById(String(job.acceptedApplicationId));
if(!project){
  throw new NotFoundError("Application not found");
}
    if (paymentMethod === PaymentMethodEnum.wallet) {
      const userWallet = await walletService.findUserWalletByCurrency(userId, currency);
      if (!userWallet || userWallet.balance < milestone.amount) {
         throw new BadRequestError("Insufficient wallet balance" );
      }
      const transactionPayload = {
          userId,
          type: TransactionType.DEBIT,
          amount:milestone.amount,
          description: `Job payment via wallet`,
          paymentMethod: paymentMethod,
          balanceBefore: userWallet.balance,
          walletId: userWallet._id,
          currency: userWallet.currency,
          status: TransactionEnum.completed,
          jobId,
          milestoneId,
          recieverId: project.user, 
        };
      const transaction = await transactionService.createTransaction(transactionPayload);
      userWallet.balance -= milestone.amount;
      await userWallet.save();
      transaction.balanceAfter = userWallet.balance;
      milestone.paymentStatus =  MilestonePaymentStatus.paid;
      milestone.paymentInfo.amountPaid = milestone.amount;
      milestone.paymentInfo.paymentMethod = PaymentMethodEnum.wallet;  
      milestone.paymentInfo.date = new Date();
      await job.save();
       data = "Payment successful"
    } else if (paymentMethod === PaymentMethodEnum.card) {
      if (paymentMethod === PaymentMethodEnum.card && currency === WalletEnum.NGN ) {
          const transactionPayload = {
              userId,
              type: TransactionType.DEBIT,
              amount:milestone.amount,
              description: `Job payment via card`,
              paymentMethod: paymentMethod,
              currency: currency,
              status: TransactionEnum.pending,
              reference:`PS-${Date.now()}`,
              jobId,
              milestoneId,
              recieverId: project.user, 
             };
          const transaction = await transactionService.createTransaction(transactionPayload);
          transaction.paymentService = PaymentServiceEnum.paystack;
          await transaction.save();
          const paymentLink = await generatePaystackPaymentLink(transaction.reference, milestone.amount, req.user.email);
          data = { paymentLink, transaction };
    }
  }
  return successResponse(res, StatusCodes.CREATED, data);
}   
);

export const verifyPaystackJobPayment=  catchAsync(async (req: JwtPayload, res: Response) => {
  const {reference} = req.params;
  const transaction = await transactionService.fetchTransactionByReference(reference);
  if(!transaction){
    throw new NotFoundError("Transaction not found!");
  };
  const job = await jobService.fetchJobById(transaction.jobId!);
  if(!job){
    throw new NotFoundError("Job Not found");
  }
  const milestone = job.milestones.find((milestone: any)=> milestone._id.toString()  === transaction.milestoneId.toString());
  if(!milestone){
    throw new NotFoundError("No milestone");
  }

  let message;
  const verifyPayment = await  verifyPaystackPayment(reference);
  if(verifyPayment == "success"){
    milestone.paymentStatus =  MilestonePaymentStatus.paid;
    milestone.paymentInfo.amountPaid = milestone.amount;
    milestone.paymentInfo.paymentMethod = PaymentMethodEnum.card;  
    milestone.paymentInfo.date = new Date();
    transaction.status = TransactionEnum.completed;
    transaction.dateCompleted = new Date();
    await transaction.save();
    await job.save();
    message = "Payment successfully";
  }else {
    transaction.status = TransactionEnum.failed;
    message = "Payment failed";
    await transaction.save();
  }
  return successResponse(res, StatusCodes.OK, message);
});