import { JwtPayload } from "jsonwebtoken";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { BadRequestError, NotFoundError } from "../errors/error";
import { CartStatus } from "../enums/cart.enum";
import { OrderPaymentStatus, OrderStatus } from "../enums/order.enum";
import * as cartService from "../services/cart.service";
import * as orderService from "../services/order.service";
import * as productService from "../services/product.service";
import * as transactionService from "../services/transaction.service";


const SHIPPING_FEE = 9000;

const cartItemCount = (cart: any) =>
  (cart.products || []).reduce((total: number, item: any) => total + item.quantity, 0);

const cartProductId = (item: any) => String(item.productId?._id || item.productId);

const cartResponse = async (cart: any) => {
  const populatedCart = await cart.populate({
    path: "products.productId",
    populate: {
      path: "category",
      select: "name slug",
    },
  });
  const data = populatedCart.toObject();
  return {
    ...data,
    products: (data.products || []).map((item: any) => {
      // Ensure category is properly shaped (id + name, not just an object id)
      const product = item.productId || {};
      if (product.category && typeof product.category === 'object' && product.category._id) {
        product.category = {
          id: product.category._id,
          name: product.category.name || '',
          slug: product.category.slug || '',
        };
      }
      return { ...item, lineTotal: item.quantity * item.price };
    }),
    cartQuantity: cartItemCount(populatedCart),
    orderSummary: await calculateOrderTotals(data.totalAmount || 0, 0),
  };
};

const calculateOrderTotals = async (subtotal: number, discountAmount: number) => {
  const config = await transactionService.getVat();
  const taxRate = Number(config?.vat ?? 0) / 100;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number((discountedSubtotal * taxRate).toFixed(2));
  const totalAmount = Number((discountedSubtotal + taxAmount + SHIPPING_FEE).toFixed(2));
  return { subtotalAmount: subtotal, discountAmount, taxAmount, shippingAmount: SHIPPING_FEE, totalAmount };
};

export const addToCartController = catchAsync(async (req: JwtPayload, res: Response) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;
  const product = await productService.fetchProductById(productId);
  if (!product) throw new NotFoundError("Product not found");
  if (String(product.userId) === String(userId)) throw new BadRequestError("You cannot add your own product to the cart");
  if (Number(product.availableQuantity) < quantity) throw new BadRequestError("Not enough product available in stock");

  const price = product.isDiscounted && product.discountedPrice != null ? product.discountedPrice : product.price;
  let cart = await cartService.fetchCartByUser(userId);
  if (!cart) {
    cart = await cartService.createCart({
      userId,
      products: [{ productId, quantity, price }],
      totalAmount: price * quantity,
    });
    return successResponse(res, StatusCodes.CREATED, await cartResponse(cart));
  }

  const item = cart.products?.find((entry) => cartProductId(entry) === String(productId));
  if (item) {
    if (item.quantity + quantity > Number(product.availableQuantity)) throw new BadRequestError("Not enough product available in stock");
    item.quantity += quantity;
    item.price = price;
  } else {
    cart.products?.push({ productId, quantity, price });
  }
  cart.totalAmount = (cart.products || []).reduce((total, entry) => total + entry.quantity * entry.price, 0);
  await cart.save();
  return successResponse(res, StatusCodes.OK, await cartResponse(cart));
});

export const removeFromCartController = catchAsync(async (req: JwtPayload, res: Response) => {
  const cart = await cartService.fetchCartByUser(req.user._id);
  if (!cart) throw new NotFoundError("Cart not found");
  const originalCount = cart.products?.length || 0;
  cart.products = (cart.products || []).filter((item) => cartProductId(item) !== req.params.productId);
  if (cart.products.length === originalCount) throw new NotFoundError("Product not found in cart");
  cart.totalAmount = cart.products.reduce((total, item) => total + item.quantity * item.price, 0);
  await cart.save();
  return successResponse(res, StatusCodes.OK, await cartResponse(cart));
});

export const clearCartController = catchAsync(async (req: JwtPayload, res: Response) => {
  const cart = await cartService.fetchCartByUser(req.user._id);
  if (!cart) throw new NotFoundError("Cart not found");
  cart.products = [];
  cart.totalAmount = 0;
  await cart.save();
  return successResponse(res, StatusCodes.OK, await cartResponse(cart));
});

const changeQuantity = async (userId: string, productId: string, adjustment: 1 | -1) => {
  const cart = await cartService.fetchCartByUser(userId);
  if (!cart) throw new NotFoundError("Cart not found");
  console.log(productId, cart.products);
  const item = cart.products?.find((entry) => cartProductId(entry) === productId);
  if (!item) throw new NotFoundError("Product not found in cart");
  if (adjustment === -1 && item.quantity === 1) throw new BadRequestError("Cannot decrease quantity below 1; remove the item instead");
  if (adjustment === 1) {
    const product = await productService.fetchProductById(productId);
    if (!product) throw new NotFoundError("Product does not exist");
    if (item.quantity + 1 > Number(product.availableQuantity)) throw new BadRequestError("Not enough product available in stock");
    item.price = product.isDiscounted && product.discountedPrice != null ? product.discountedPrice : product.price;
  }
  item.quantity += adjustment;
  cart.totalAmount = (cart.products || []).reduce((total, entry) => total + entry.quantity * entry.price, 0);
  await cart.save();
  return cart;
};

export const increaseCartProductQuantityController = catchAsync(async (req: JwtPayload, res: Response) => {
  const cart = await changeQuantity(req.user._id, req.params.productId, 1);
  return successResponse(res, StatusCodes.OK, await cartResponse(cart));
});

export const decreaseCartProductQuantityController = catchAsync(async (req: JwtPayload, res: Response) => {
  const cart = await changeQuantity(req.user._id, req.params.productId, -1);
  return successResponse(res, StatusCodes.OK, await cartResponse(cart));
});

export const applyDiscountCode = catchAsync(async (req: JwtPayload, res: Response) => {
  const code = String(req.body.code || "").trim();
  if (!code) throw new BadRequestError("Discount code is required");
  const [discount, cart] = await Promise.all([cartService.fetchDiscountCode(code), cartService.fetchCartByUser(req.user._id)]);
  if (!discount) throw new NotFoundError("Invalid or expired discount code");
  if (!cart || !cart.products?.length) throw new BadRequestError("Your cart is empty");
  const discountAmount = Number((cart.totalAmount! * discount.discountPercentage / 100).toFixed(2));
  return successResponse(res, StatusCodes.OK, { code: discount.code, discountPercentage: discount.discountPercentage, ...await calculateOrderTotals(cart.totalAmount!, discountAmount) });
});

export const checkoutCartController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { code, shippingAddress, orderNote } = req.body;
  const cart = await cartService.fetchCartByUser(userId);
  if (!cart || !cart.products?.length) throw new BadRequestError("Your cart is empty");

  const existingOrder = await orderService.fetchOrderByCartIdForUser(String(cart._id), String(userId));
  if (existingOrder) return successResponse(res, StatusCodes.OK, existingOrder);

  let discount: any;
  if (code?.trim()) {
    discount = await cartService.fetchDiscountCode(code);
    if (!discount) throw new NotFoundError("Invalid or expired discount code");
  }

  // Build order products WITH snapshots captured at order-creation time.
  // Product name/brand/category/price + merchant name/rating/review count are
  // stored on the order itself so later changes never alter past orders.
  const orderProducts: any[] = [];
  for (const item of cart.products) {
    const product = await productService.fetchProductById(item.productId);
    if (!product || Number(product.availableQuantity) < item.quantity) {
      throw new BadRequestError(`Product ${product?.name || item.productId} is out of stock`);
    }
    const category: any = product.category
      ? await productService.fetchSingleCategory(String(product.category))
      : null;
    const merchantRating = await productService.fetchMerchantRatingForSeller(String(product.userId));
    const primaryImage = product.images?.find((img: any) => img.isPrimary);
    orderProducts.push({
      productId: product._id,
      quantity: item.quantity,
      price: item.price,
      productName: product.name,
      brand: product.brand,
      categoryName: category?.name || "",
      thumbnail: primaryImage?.imageUrl || product.images?.[0]?.imageUrl || "",
      quantityMetric: product.quantityMetric,
      merchantId: product.userId,
      merchantName: product.merchantName,
      merchantRating: merchantRating.merchantRating,
      merchantReviewCount: merchantRating.merchantReviewCount,
      totalUnitsSoldAtPurchase: product.totalUnitsSold || 0,
    });
  }
  const discountAmount = discount ? Number((cart.totalAmount! * discount.discountPercentage / 100).toFixed(2)) : 0;
  const totals = await calculateOrderTotals(cart.totalAmount!, discountAmount);
  const order = await orderService.createOrder({
    userId,
    products: orderProducts,
    ...totals,
    discountApplied: Boolean(discount),
    originalTotalAmount: cart.totalAmount,
    discountCode: discount?.code,
    shippingAddress: shippingAddress || undefined,
    orderNote: orderNote || undefined,
    status: OrderStatus.pending,
    paymentStatus: OrderPaymentStatus.unpaid,
    cartId: cart._id,
  });
  if (discount) await cartService.incrementDiscountUsage(String(discount._id));
  return successResponse(res, StatusCodes.CREATED, order);
});

export const generateDiscountCode = catchAsync(async (req: JwtPayload, res: Response) => {
  const { discountPercentage, expiryDate, isSingleUse } = req.body;
  const code = Math.random().toString(36).slice(2, 9).toUpperCase();
  const discountCode = await cartService.createDiscount({ code, discountPercentage, expiryDate, isSingleUse, createdBy: req.user._id });
  return successResponse(res, StatusCodes.CREATED, discountCode);
});

export const getCartController = catchAsync(async (req: JwtPayload, res: Response) => {
  const cart = await cartService.fetchCartByUser(req.user._id);
  if (!cart) return successResponse(res, StatusCodes.OK, { products: [], totalAmount: 0, cartQuantity: 0, status: CartStatus.active });
  return successResponse(res, StatusCodes.OK, await cartResponse(cart));
});