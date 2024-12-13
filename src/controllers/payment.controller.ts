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

export const payforProductController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {cartId, paymentMethod, currency} = req.body;
    let data;
    const cart = await cartService.fetchCartByIdPayment(cartId, userId);
    if(!cart || cart.userId?.toString() !== userId.toString()){
        throw new NotFoundError("Cart not found or unauthorized access");
    };

    const totalAmount = cart.totalAmount!;

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
          };
        const transaction = await transactionService.createTransaction(transactionPayload);
        userWallet.balance -= totalAmount;
        await userWallet.save();
        transaction.balanceAfter = userWallet.balance;
        await transaction.save();
          cart.isPaid = true;
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

  let message;
  const verifyPayment = await  verifyPaystackPayment(reference);
  if(verifyPayment == "success"){
    cart.isPaid = true;
    cart.status = CartStatus.checkedOut;
    await cart.save();
    transaction.status = TransactionEnum.completed;
    transaction.dateCompleted = new Date();
    await transaction.save();
    message = "Payment successfully";
  }else {
    transaction.status = TransactionEnum.failed;
    message = "Payment failed";
    await transaction.save();
  }
  return successResponse(res, StatusCodes.OK, message);
});
