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
import * as promoService from "../services/promo.service";


// Delivery fee is defaulted to 0 for now
const SHIPPING_FEE = 0;

const cartItemCount = (cart: any) =>
  (cart.products || []).reduce((total: number, item: any) => total + item.quantity, 0);

const cartProductId = (item: any) => String(item.productId?._id || item.productId);

// Per-line financials for the cart:
// 1. Promos - resolves every applied code into a per-code/per-product breakdown.
//    A promo only counts while it is active/unexpired and at least one of its
//    scoped products is still in the cart.
// 2. Tax - each product's own taxPercentage (0 = tax free) applied to the
//    post-promo line amount.
const computeCartFinancials = async (cart: any) => {
  const applied = cart.appliedPromoCodes || [];
  const cartItems = cart.products || [];
  const promoDiscountPerProduct = new Map<string, number>();
  const taxPerProduct = new Map<string, number>();
  const appliedPromos: any[] = [];
  let totalDiscount = 0;
  let totalTax = 0;

  if (applied.length) {
    const promos: any[] = await promoService.fetchPromosByIds(applied.map((entry: any) => String(entry.discountId)));
    for (const entry of applied) {
      const promo: any = promos.find((p) => String(p._id) === String(entry.discountId));
      if (!promo || !promoService.isPromoUsable(promo)) continue;
      const scopeIds: string[] = (promo.productIds || []).map((id: any) => String(id));
      const products = cartItems
        .filter((item: any) => scopeIds.includes(cartProductId(item)))
        .map((item: any) => {
          const lineTotal = item.quantity * item.price;
          const lineDiscount = Number((lineTotal * promo.discountPercentage / 100).toFixed(2));
          totalDiscount += lineDiscount;
          const productId = cartProductId(item);
          promoDiscountPerProduct.set(productId, (promoDiscountPerProduct.get(productId) || 0) + lineDiscount);
          const productDoc: any = item.productId;
          return {
            productId,
            productName: productDoc?.name,
            quantity: item.quantity,
            unitPrice: item.price,
            lineTotal,
            discountAmount: lineDiscount,
          };
        });
      appliedPromos.push({
        code: promo.code,
        discountPercentage: promo.discountPercentage,
        expiryDate: promo.expiryDate,
        sellerId: promo.sellerId,
        discountAmount: Number(products.reduce((sum: number, p: any) => sum + p.discountAmount, 0).toFixed(2)),
        products,
      });
    }
  }

  // Tax is charged per product line on the post-promo amount; products default
  // to tax free (rate 0 / unset).
  for (const item of cartItems) {
    const productId = cartProductId(item);
    const lineNet = Math.max(0, item.quantity * item.price - (promoDiscountPerProduct.get(productId) || 0));
    const taxRate = Number((item.productId as any)?.taxPercentage ?? 0) || 0;
    const lineTax = Number((lineNet * taxRate / 100).toFixed(2));
    totalTax += lineTax;
    taxPerProduct.set(productId, lineTax);
  }

  return {
    appliedPromos,
    promoDiscountAmount: Number(totalDiscount.toFixed(2)),
    promoDiscountPerProduct,
    taxAmount: Number(totalTax.toFixed(2)),
    taxPerProduct,
  };
};

const cartResponse = async (cart: any) => {
  const populatedCart = await cart.populate({
    path: "products.productId",
    populate: {
      path: "category",
      select: "name slug",
    },
  });
  const data = populatedCart.toObject();
  const { appliedPromos, promoDiscountAmount, promoDiscountPerProduct, taxAmount, taxPerProduct } = await computeCartFinancials(populatedCart);
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
      return {
        ...item,
        lineTotal: item.quantity * item.price,
        promoDiscountAmount: promoDiscountPerProduct.get(cartProductId(item)) || 0,
        taxAmount: taxPerProduct.get(cartProductId(item)) || 0,
      };
    }),
    appliedPromos,
    promoDiscountAmount,
    cartQuantity: cartItemCount(populatedCart),
    orderSummary: calculateOrderTotals(data.totalAmount || 0, promoDiscountAmount, taxAmount),
  };
};

// Tax is computed per product line (each product's own taxPercentage, 0 = tax
// free) and passed in already summed; delivery fee is currently 0.
const calculateOrderTotals = (subtotal: number, discountAmount: number, taxAmount: number) => {
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
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
  const prunedCart = await cartService.pruneAppliedPromos(cart);
  return successResponse(res, StatusCodes.OK, await cartResponse(prunedCart));
});

export const clearCartController = catchAsync(async (req: JwtPayload, res: Response) => {
  const cart = await cartService.fetchCartByUser(req.user._id);
  if (!cart) throw new NotFoundError("Cart not found");
  cart.products = [];
  cart.appliedPromoCodes = [];
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

export const applyPromoCodeController = catchAsync(async (req: JwtPayload, res: Response) => {
  const code = String(req.body.code || "").trim();
  if (!code) throw new BadRequestError("Promo code is required");
  const cart = await cartService.fetchCartByUser(req.user._id);
  if (!cart || !cart.products?.length) throw new BadRequestError("Your cart is empty");

  const promo: any = await promoService.fetchPromoByCode(code);
  if (!promo) throw new NotFoundError("Invalid or expired promo code");

  if ((cart.appliedPromoCodes || []).some((entry: any) => String(entry.discountId) === String(promo._id))) {
    throw new BadRequestError("This promo code is already applied to your cart");
  }

  // Product-scoped: the code is useless unless one of its products is in the cart
  const scopeIds: string[] = (promo.productIds || []).map((id: any) => String(id));
  const cartProductIds = new Set(cart.products.map((item: any) => cartProductId(item)));
  if (!scopeIds.some((id) => cartProductIds.has(id))) {
    throw new BadRequestError("This promo code does not apply to any product in your cart");
  }

  // One code per seller and no product overlap between applied codes
  const existingIds = (cart.appliedPromoCodes || []).map((entry: any) => String(entry.discountId));
  const existingPromos: any[] = existingIds.length ? await promoService.fetchPromosByIds(existingIds) : [];
  const sameSeller = existingPromos.find((p) => String(p.sellerId) === String(promo.sellerId));
  if (sameSeller) throw new BadRequestError(`Promo code ${sameSeller.code} from this seller is already applied - only one code per seller`);
  const overlapping = existingPromos.find((p: any) => (p.productIds || []).some((id: any) => scopeIds.includes(String(id))));
  if (overlapping) throw new BadRequestError(`Promo code ${overlapping.code} already covers one or more of these products`);

  await cartService.addAppliedPromo(cart, promo);

  const freshCart = await cartService.fetchCartByUser(req.user._id);
  return successResponse(res, StatusCodes.OK, {
    message: `Promo code ${promo.code} applied`,
    ...(await cartResponse(freshCart!)),
  });
});

export const removePromoCodeController = catchAsync(async (req: JwtPayload, res: Response) => {
  const code = String(req.params.code || "").trim().toUpperCase();
  const cart = await cartService.fetchCartByUser(req.user._id);
  if (!cart) throw new NotFoundError("Cart not found");
  if (!(cart.appliedPromoCodes || []).some((entry: any) => entry.code === code)) {
    throw new NotFoundError("This promo code is not applied to your cart");
  }
  await cartService.removeAppliedPromo(cart, code);
  const freshCart = await cartService.fetchCartByUser(req.user._id);
  return successResponse(res, StatusCodes.OK, {
    message: `Promo code ${code} removed`,
    ...(await cartResponse(freshCart!)),
  });
});

export const checkoutCartController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { code, shippingAddress, orderNote } = req.body;
  const cart = await cartService.fetchCartByUser(userId);
  if (!cart || !cart.products?.length) throw new BadRequestError("Your cart is empty");

  const existingOrder = await orderService.fetchOrderByCartIdForUser(String(cart._id), String(userId));
  if (existingOrder) return successResponse(res, StatusCodes.OK, existingOrder);

  // === Resolve promos for this checkout ===
  // Codes already applied on the cart are the source of truth. An optional
  // inline `code` in the body is still honoured for backward compatibility.
  const appliedEntries: any[] = [...(cart.appliedPromoCodes || [])];
  let inlinePromo: any = null;
  if (code?.trim()) {
    inlinePromo = await promoService.fetchPromoByCode(code);
    if (!inlinePromo) throw new NotFoundError("Invalid or expired promo code");
    if (!appliedEntries.some((entry: any) => String(entry.discountId) === String(inlinePromo._id))) {
      appliedEntries.push({ discountId: inlinePromo._id, code: inlinePromo.code });
    }
  }
  const appliedPromos: any[] = appliedEntries.length
    ? await promoService.fetchPromosByIds(appliedEntries.map((entry: any) => String(entry.discountId)))
    : [];

  const cartProductIds = new Set(cart.products.map((item: any) => cartProductId(item)));
  // Stale applied codes (expired/revoked/no longer in cart) are skipped silently...
  let effectivePromos = appliedPromos.filter(
    (promo: any) => promoService.isPromoUsable(promo) && (promo.productIds || []).some((id: any) => cartProductIds.has(String(id)))
  );
  // ...but an explicitly typed inline code that conflicts is a hard error
  if (inlinePromo) {
    const sameSeller = effectivePromos.find((p: any) => String(p._id) !== String(inlinePromo._id) && String(p.sellerId) === String(inlinePromo.sellerId));
    if (sameSeller) throw new BadRequestError(`Promo code ${sameSeller.code} from this seller is already applied - only one code per seller`);
    const overlapping = effectivePromos.find((p: any) =>
      String(p._id) !== String(inlinePromo._id) &&
      (p.productIds || []).some((id: any) => (inlinePromo.productIds || []).some((pid: any) => String(pid) === String(id)))
    );
    if (overlapping) throw new BadRequestError(`Promo code ${overlapping.code} already covers one or more of these products`);
    if (!effectivePromos.some((p: any) => String(p._id) === String(inlinePromo._id))) {
      effectivePromos = [...effectivePromos, inlinePromo];
    }
  }
  // Each cart line is covered by at most one promo (one code per seller and no
  // product overlap between codes are enforced at apply time)
  const promoByProduct = new Map<string, any>();
  for (const promo of effectivePromos) {
    for (const id of promo.productIds || []) {
      const productId = String(id);
      if (cartProductIds.has(productId)) promoByProduct.set(productId, promo);
    }
  }
  let promoDiscountTotal = 0;
  let taxTotal = 0;

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
    const linePromo: any = promoByProduct.get(String(product._id));
    const lineDiscount = linePromo ? Number((item.quantity * item.price * linePromo.discountPercentage / 100).toFixed(2)) : 0;
    promoDiscountTotal += lineDiscount;
    // Tax is charged per product (taxPercentage, 0 = tax free) on the post-promo line amount
    const lineTaxRate = Number(product.taxPercentage ?? 0) || 0;
    const lineTax = Number((Math.max(0, item.quantity * item.price - lineDiscount) * lineTaxRate / 100).toFixed(2));
    taxTotal += lineTax;
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
      // Promo snapshot: which code hit this line and how much it saved
      discountAmount: lineDiscount,
      promoCode: linePromo?.code,
      // Tax snapshot: the product's own rate and what this line was charged
      taxPercentage: lineTaxRate,
      taxAmount: lineTax,
    });
  }
  const discountAmount = Number(promoDiscountTotal.toFixed(2));
  const totals = calculateOrderTotals(cart.totalAmount!, discountAmount, Number(taxTotal.toFixed(2)));
  const order = await orderService.createOrder({
    userId,
    products: orderProducts,
    ...totals,
    discountApplied: discountAmount > 0,
    originalTotalAmount: cart.totalAmount,
    promoCodes: [...new Set(effectivePromos.map((promo: any) => promo.code))],
    discountCode: effectivePromos[0]?.code,
    shippingAddress: shippingAddress || undefined,
    orderNote: orderNote || undefined,
    status: OrderStatus.pending,
    paymentStatus: OrderPaymentStatus.unpaid,
    cartId: cart._id,
  });
  for (const promo of effectivePromos) {
    await promoService.incrementPromoUsage(String(promo._id));
  }
  return successResponse(res, StatusCodes.CREATED, order);
});

export const getCartController = catchAsync(async (req: JwtPayload, res: Response) => {
  const cart = await cartService.fetchCartByUser(req.user._id);
  if (!cart) return successResponse(res, StatusCodes.OK, { products: [], appliedPromos: [], promoDiscountAmount: 0, totalAmount: 0, cartQuantity: 0, status: CartStatus.active });
  const prunedCart = await cartService.pruneAppliedPromos(cart);
  return successResponse(res, StatusCodes.OK, await cartResponse(prunedCart));
});