import { IOrder } from "../interfaces/order.interface";
import Order from "../models/order.model";
import { OrderDeliveryStatus, OrderPaymentStatus, OrderStatus } from "../enums/order.enum";
import { TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import * as walletService from "./wallet.services";
import * as transactionService from "./transaction.service";
import * as productService from "./product.service";
import * as cartService from "./cart.service";
import { BadRequestError } from "../errors/error";

export const createOrder = async (payload: any) => {
  return await Order.create(payload);
};

export const fetchOrderByCartId = async (cartId: string) => {
  return await Order.findOne({ cartId });
};

export const fetchOrderByCartIdForUser = async (cartId: string, userId: string) => {
  return await Order.findOne({ cartId, userId });
};

export const fetchOrderByOrderId = async (orderId: string) => {
  return await Order.findById(orderId);
};

export const fetchOrderByIdAndUser = async (orderId: string, userId: string) => {
  return await Order.findOne({ _id: orderId, userId });
};

// Real server-side pagination — never fetch-all-then-slice.
export const fetchOrdersForUser = async (
  userId: string,
  {
    page = 1,
    limit = 10,
    sortBy = "latest",
    status,
  }: {
    page?: number;
    limit?: number;
    sortBy?: string;
    status?: string;
  }
) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const pageSize = Math.max(Number(limit) || 10, 1);
  const skip = (currentPage - 1) * pageSize;

  const query: any = { userId };
  if (status && Object.values(OrderDeliveryStatus).includes(status as OrderDeliveryStatus)) {
    query.deliveryStatus = status;
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    latest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    total_high_low: { totalAmount: -1 },
    total_low_high: { totalAmount: 1 },
  };

  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort(sortMap[sortBy] || sortMap.latest)
      .skip(skip)
      .limit(pageSize),
    Order.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  return {
    orders,
    pagination: {
      total,
      currentPage,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    },
  };
};

export const pushDeliveryStep = async (orderId: string, status: OrderDeliveryStatus, note?: string) => {
  return await Order.findByIdAndUpdate(
    orderId,
    {
      $set: { deliveryStatus: status },
      $push: { deliverySteps: { status, timestamp: new Date(), note: note || undefined } },
    },
    { new: true }
  );
};

const restoreOrderStock = async (order: any) => {
  for (const item of order.products || []) {
    const product = await productService.fetchProductById(item.productId);
    if (product) {
      product.availableQuantity += item.quantity;
      product.totalUnitsSold = Math.max(0, (product.totalUnitsSold || 0) - item.quantity);
      await product.save();
    }
  }
};

// Refund a paid order to the user's NGN wallet via the existing wallet/transaction services.
const refundPaidOrder = async (order: any) => {
  if (order.paymentStatus !== OrderPaymentStatus.paid) return;

  const wallet = await walletService.findUserWalletByCurrency(String(order.userId), WalletEnum.NGN);
  if (!wallet) throw new BadRequestError("No NGN wallet found to process refund");

  wallet.balance += order.totalAmount;
  await wallet.save();

  await transactionService.createTransaction({
    userId: order.userId,
    type: TransactionType.CREDIT,
    amount: order.totalAmount,
    description: `Refund for order ${order._id}`,
    paymentMethod: "Wallet",
    balanceBefore: wallet.balance - order.totalAmount,
    balanceAfter: wallet.balance,
    walletId: wallet._id,
    currency: wallet.currency,
    status: TransactionEnum.completed,
    orderId: order._id,
  });
};

export const cancelOrder = async (orderId: string, userId: string, reason?: string) => {
  const order = await fetchOrderByIdAndUser(orderId, userId);
  if (!order) throw new BadRequestError("Order not found");

  if (order.deliveryStatus !== OrderDeliveryStatus.orderConfirmed) {
    throw new BadRequestError(
      `Order cannot be cancelled from "${order.deliveryStatus}" status`
    );
  }

  await restoreOrderStock(order);
  await refundPaidOrder(order);

  const updated = await Order.findByIdAndUpdate(
    orderId,
    {
      $set: {
        status: OrderStatus.canceled,
        deliveryStatus: OrderDeliveryStatus.canceled,
        cancelReason: reason || undefined,
        cancelledAt: new Date(),
      },
      $push: {
        deliverySteps: {
          status: OrderDeliveryStatus.canceled,
          timestamp: new Date(),
          note: reason || "Order cancelled",
        },
      },
    },
    { new: true }
  );

  return updated;
};

export const returnOrder = async (orderId: string, userId: string, reason?: string) => {
  const order = await fetchOrderByIdAndUser(orderId, userId);
  if (!order) throw new BadRequestError("Order not found");

  if (order.deliveryStatus !== OrderDeliveryStatus.delivered) {
    throw new BadRequestError("Order can only be returned after delivery");
  }

  // 7-day return window from delivery
  if (order.deliveredAt) {
    const windowEnd = new Date(order.deliveredAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (new Date() > windowEnd) {
      throw new BadRequestError("Return window of 7 days has expired");
    }
  }

  await restoreOrderStock(order);
  await refundPaidOrder(order);

  const updated = await Order.findByIdAndUpdate(
    orderId,
    {
      $set: {
        deliveryStatus: OrderDeliveryStatus.returned,
        returnReason: reason || undefined,
        returnedAt: new Date(),
      },
      $push: {
        deliverySteps: {
          status: OrderDeliveryStatus.returned,
          timestamp: new Date(),
          note: reason || "Order returned",
        },
      },
    },
    { new: true }
  );

  return updated;
};

// Re-create a fresh active cart from a delivered order's items.
// Re-checks current stock/price at reorder time (never assumes original availability).
export const createReorderCart = async (orderId: string, userId: string) => {
  const order = await fetchOrderByIdAndUser(orderId, userId);
  if (!order) throw new BadRequestError("Order not found");

  if (order.deliveryStatus !== OrderDeliveryStatus.delivered) {
    throw new BadRequestError("Reorder is only available for delivered orders");
  }

  const products: any[] = [];
  let totalAmount = 0;

  for (const item of order.products || []) {
    const product = await productService.fetchProductById(item.productId);
    if (!product) throw new BadRequestError("A product in this order no longer exists");

    const currentPrice =
      product.isDiscounted && product.discountedPrice != null
        ? product.discountedPrice
        : product.price;

    if (Number(product.availableQuantity) < item.quantity) {
      throw new BadRequestError(
        `Insufficient stock for ${product.name || "a product"} — only ${product.availableQuantity} available`
      );
    }

    products.push({ productId: product._id, quantity: item.quantity, price: currentPrice });
    totalAmount += currentPrice * item.quantity;
  }

  const cart = await cartService.createCart({
    userId,
    products,
    totalAmount,
    status: "active",
    isPaid: false,
  });

  return cart;
};