import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import * as productService from "../services/product.service";
import * as cartService from "../services/cart.service";
import * as walletService from "../services/wallet.services";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/error";
import { PaymentMethodEnum, TransactionType } from "../enums/transaction.enum";
import * as transactionService from "../services/transaction.service";

// export const payforProductController = catchAsync(async (req: JwtPayload, res: Response) => {
//     const userId = req.user._id;
//     const {cartId, paymentMethod, currency} = req.body;
//     const cart = await cartService.fetchCartByIdPayment(cartId, userId);
//     if(!cart || cart.userId?.toString() !== userId.toString()){
//         throw new NotFoundError("Cart not found or unauthorized access");
//     }

//     const totalAmount = cart.totalAmount!;

//     // Verify product availability
//     for (const item of cart.products!) {
//       const product = item.productId as any; 
//       if (product.availableQuantity < item.quantity) {
//         throw new BadRequestError(`Insufficient stock for ${product.name}` );
//       }

//       if (paymentMethod === PaymentMethodEnum.wallet) {
//         // Wallet payment
//         const userWallet = await walletService.findUserWalletByCurrency(userId, currency);
//         if (!userWallet || userWallet.balance < totalAmount) {
//            throw new BadRequestError("Insufficient wallet balance" );
//         }
//         const transactionPayload = {
//             userId,
//             type: TransactionType.CREDIT,
//             totalAmount,
//             description: `Wallet funding via ${paymentMethod}`,
//             paymentMethod: paymentMethod,
//             reference: paymentMethod === PaymentMethodEnum.card ? `PS-${Date.now()}` : `BT-${Date.now()}`,
//             recieverId: userId,
//             balanceBefore: wallet.balance,
//             walletId,
//             currency,
//           };
//         const transaction = await transactionService.createTransaction(transactionPayload);
//         // Deduct user wallet balance and credit admin wallet
//         userWallet.balance -= totalAmount;
//         await userWallet.save();
  
//         paymentStatus = "successful";
//       } else if (paymentMethod === "card") {
//         // Paystack card payment
//         const paystackResponse = await PaystackService.chargeCard({
//           amount: totalAmount,
//           currency: "NGN",
//           email: req.user.email,
//           cardDetails,
//         });
  
//         if (!paystackResponse.success) {
//           return res.status(400).json({ error: "Card payment failed" });
//         }
//         paymentStatus = "successful";
//       } else {
//         return res.status(400).json({ error: "Invalid payment method" });
//       }
//    return successResponse(res, StatusCodes.CREATED, data);
//   });   