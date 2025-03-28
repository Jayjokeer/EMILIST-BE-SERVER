import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import * as cartService from "../services/cart.service";
import * as productService from "../services/product.service";
import { BadRequestError, NotFoundError } from "../errors/error";
import { CartStatus } from "../enums/cart.enum";
import { ICart } from "../interfaces/cart.interface";
import { OrderPaymentStatus, OrderStatus } from "../enums/order.enum";
import * as orderService from "../services/order.service";
import mongoose from "mongoose";


export const addToCartController = catchAsync(async (req: JwtPayload, res: Response) => {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    const product = await productService.fetchProductById(productId);
    if (!product) throw new NotFoundError("Product not found!");
    if (String(product.userId) === String(userId)) {
        throw new BadRequestError("You cannot add your product to the cart");
    }

    const productPrice = product.isDiscounted && product.discountedPrice ? product.discountedPrice : product.price as number;

    let cart = await cartService.fetchCartByUser(userId);

    if (!cart) {
        const payload = {
            userId,
            products: [{ productId, quantity, price: productPrice }],
            totalAmount: productPrice * quantity,
        };

        cart = await cartService.createCart(payload);

        const cartQuantity = payload.products.reduce((sum, p) => sum + p.quantity, 0);

        const data = { ...cart.toObject(), cartQuantity };
        return successResponse(res, StatusCodes.CREATED, data);
    }
    const cartCompare = await cartService.fetchCartById(String(cart._id))
    const existingProductIndex = cartCompare!.products!.findIndex(
        (p) => p.productId!.toString() === productId.toString()
    );

    if (existingProductIndex >= 0) {
        cart.products![existingProductIndex].quantity += quantity;

                cart.products![existingProductIndex].price = productPrice;
    } else {
        cart.products!.push({ productId, quantity, price: productPrice });
    }

    cart.totalAmount = cart.products!.reduce((sum, p) => sum + p.quantity * p.price, 0);

   
    const savedCart = await cart.save();


    const cartQuantity = savedCart.products!.reduce((sum, p) => sum + p.quantity, 0);

   
    const productsWithDetails = await Promise.all(
        savedCart.products!.map(async (item) => {
            const productDetails = await productService.fetchProductById(item.productId);
            return {
                productId: productDetails || item.productId, 
                quantity: item.quantity,
                price: item.price,
            };
        })
    );

  
    const data = { ...savedCart.toObject(), products: productsWithDetails, cartQuantity };
    return successResponse(res, StatusCodes.OK, data);
});




  export const removeFromCartController = catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {productId} = req.params;

    const cart = await cartService.fetchCartByUser(userId);
    if (!cart) throw new NotFoundError("Cart not found!");
    const cartCompare = await cartService.fetchCartById(String(cart._id))

    cart.products = cartCompare!.products?.filter((p) => p.productId.toString() !== productId);

    cart.totalAmount = cart.products?.reduce((sum, p) => sum + p.quantity * p.price, 0);
   const data= await cart.save();
   
    return successResponse(res, StatusCodes.OK, data);
});

export const checkoutCartController= catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const { code } = req.body; 

    const cart = await cartService.fetchCartByUser(userId);
    if (!cart) throw new NotFoundError("Cart not found");

    let discountPercentage = 0;
    let discountAmount = 0;
    let finalTotalAmount = cart.totalAmount;
    if (code) {
        const validDiscountCode = await cartService.fetchDiscountCode(code);

        if (!validDiscountCode) {
            throw new NotFoundError("Invalid or expired discount code");
        }

        discountPercentage = validDiscountCode.discountPercentage;
        validDiscountCode.useCount += 1;
        if(validDiscountCode.isSingleUse){
            validDiscountCode.isActive = false;
        }
        await validDiscountCode.save();
        discountAmount = (cart.totalAmount! * discountPercentage) / 100;
        finalTotalAmount = cart.totalAmount! - discountAmount;
    }

    for (const cartItem of cart.products!) {
        const product = await productService.fetchProductById(cartItem.productId);
      if (!product || Number(product.availableQuantity) < cartItem.quantity) {
        throw new NotFoundError(`Product ${product?.name} is out of stock`);
      }
      product.availableQuantity = product.availableQuantity! - cartItem.quantity;
      await product.save();
    }
    const orderPayload = {
      userId,
      products: cart.products?.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: finalTotalAmount,
      discountApplied: discountAmount > 0,
      discountAmount,
      originalTotalAmount: cart.totalAmount,
      status: OrderStatus.pending,
      paymentStatus:OrderPaymentStatus.unpaid,
      discountCode: code,
      cartId: cart._id,
    };
    const order = await orderService.createOrder(orderPayload );
    await cart.save();

    const data = order; 

    return successResponse(res, StatusCodes.OK, data);
});

export const increaseCartProductQuantityController= catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {productId} = req.params

    const cart = await cartService.fetchCartByUser(userId);
    if (!cart) throw new NotFoundError("Cart not found");
    const cartCompare = await cartService.fetchCartById(String(cart._id))

    const cartProduct = cartCompare!.products?.find((item) => item.productId.toString() === productId);
    if (!cartProduct) throw new NotFoundError("Product not found in cart");

    const product = await productService.fetchProductById(productId);
    if (!product) throw new  NotFoundError("Product does not exist");

    if (cartProduct.quantity + 1 > Number(product.availableQuantity)) {
      throw new  NotFoundError("Not enough product available in stock");
    }

    cartProduct.quantity += 1;

    cartCompare!.totalAmount = cartCompare!.products?.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

   const data=  await cartCompare!.save();
    return successResponse(res, StatusCodes.OK, data);
});
export const decreaseCartProductQuantityController= catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;
    const {productId} = req.params;


    const cart = await cartService.fetchCartByUser(userId);
    if (!cart) throw new NotFoundError("Cart not found");
    const cartCompare = await cartService.fetchCartById(String(cart._id))

    const cartProduct = cartCompare!.products?.find((item) => item.productId.toString() === productId);
    if (!cartProduct) throw new NotFoundError("Product not found in cart");

    if (cartProduct.quantity === 1) {
      throw new BadRequestError("Cannot decrease quantity below 1");
    }

    cartProduct.quantity -= 1;

    cartCompare!.totalAmount = cartCompare!.products?.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    const data = await cartCompare!.save();

    return successResponse(res, StatusCodes.OK, data);
});
export const applyDiscountCode = catchAsync(async (req: JwtPayload, res: Response) => {
    const { code } = req.body;
    const userId = req.user._id;

    const discountCode = await cartService.fetchDiscountCode(code);

    if (!discountCode) {
        throw new NotFoundError("Invalid or expired discount code");
    }

    const cart = await cartService.fetchCartByUser(userId);
    if (!cart) throw new NotFoundError("Cart not found");

    const discountAmount = (cart.totalAmount! * discountCode.discountPercentage) / 100;
    const discountedTotal = cart.totalAmount! - discountAmount;
    const data = {
        originalAmount: cart.totalAmount,
        discountAmount,
        discountedTotal,
    }
    return successResponse(res, StatusCodes.OK, data);
});

export const generateDiscountCode = catchAsync(async (req: JwtPayload, res: Response) => {
    const { discountPercentage, expiryDate, isSingleUse } = req.body;


    const code = `${Math.random().toString(36).substr(2, 7).toUpperCase()}`;

    const discountCode = await cartService.createDiscount({
        code,
        discountPercentage,
        expiryDate,
        isSingleUse, 
        createdBy: req.user._id,
    });
    const data = discountCode;
    return successResponse(res, StatusCodes.CREATED, data);
});
export const getCartController= catchAsync(async (req: JwtPayload, res: Response) => {
    const userId = req.user._id;

    const data = await cartService.fetchCartByUser(userId);
    return successResponse(res, StatusCodes.CREATED, data);
});
