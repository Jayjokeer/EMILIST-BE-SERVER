// import { JwtPayload } from "jsonwebtoken";
// import { catchAsync } from "../errors/error-handler";
// import { successResponse } from "../helpers/success-response";
// import * as productService from "../services/product.service";
// import * as cartService from "../services/cart.service";

// import { StatusCodes } from "http-status-codes";
// import { NextFunction, Request, Response } from "express";
// import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/error";


// export const payforProductController = catchAsync(async (req: JwtPayload, res: Response) => {
//     const userId = req.user._id;
//     const {cartId, paymentMethod} = req.body;
//     const cart = await cartService.fetchCartByIdPayment(cartId, userId);
//     if(!cart || cart.userId?.toString() !== userId.toString()){
//         throw new NotFoundError("Cart not found or unauthorized access");
//     }

//     const totalAmount = cart.totalAmount;

//     // Verify product availability
//     for (const item of cart.products!) {
//       const product = item.productId as any; // Type assertion for populated product
//       if (product.availableQuantity < item.quantity) {
//         return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
//       }
//    return successResponse(res, StatusCodes.CREATED, data);
//   });   