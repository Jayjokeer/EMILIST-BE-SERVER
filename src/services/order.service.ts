import { IOrder } from "../interfaces/order.interface";
import Order from "../models/order.model";
import { OrderDeliveryStatus, OrderPaymentStatus, OrderStatus } from "../enums/order.enum";
import { TransactionEnum, TransactionType, WalletEnum } from "../enums/transaction.enum";
import * as walletService from "./wallet.services";
import * as transactionService from "./transaction.service";
import * as productService from "./product.service";
import * as cartService from "./cart.service";
import { BadRequestError, ForbiddenError } from "../errors/error";
import { PipelineStage, Types } from "mongoose";

type OrderActorType = "buyer" | "seller" | "system" | "admin";

const orderStepDefinitions = [
  { status: OrderDeliveryStatus.orderConfirmed, label: "Order confirmed", responsibleParty: "system" },
  { status: OrderDeliveryStatus.outForDelivery, label: "Out for delivery", responsibleParty: "seller" },
  { status: OrderDeliveryStatus.delivered, label: "Delivered", responsibleParty: "buyer" },
  { status: OrderDeliveryStatus.received, label: "Received", responsibleParty: "buyer" },
] as const;

const statusRank: Partial<Record<OrderDeliveryStatus, number>> = {
  [OrderDeliveryStatus.orderConfirmed]: 0,
  [OrderDeliveryStatus.outForDelivery]: 1,
  [OrderDeliveryStatus.delivered]: 2,
  [OrderDeliveryStatus.received]: 3,
};

const dateValue = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value as string | number | Date);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const buildOrderSteps = (order: any) => {
  const savedSteps = [...(order.deliverySteps || [])].sort(
    (left: any, right: any) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
  );
  const currentRank = statusRank[order.deliveryStatus as OrderDeliveryStatus];

  const standardSteps = orderStepDefinitions.map((definition, index) => {
    const saved = savedSteps.find((step: any) => step.status === definition.status);
    const activatedAt = dateValue(saved?.timestamp)
      || (definition.status === OrderDeliveryStatus.orderConfirmed ? dateValue(order.createdAt) : undefined)
      || (definition.status === OrderDeliveryStatus.delivered ? dateValue(order.deliveredAt) : undefined)
      || (definition.status === OrderDeliveryStatus.received ? dateValue(order.receivedAt) : undefined);
    const reached = Boolean(activatedAt) || (currentRank !== undefined && currentRank >= index);
    return {
      status: definition.status,
      label: definition.label,
      responsibleParty: definition.responsibleParty,
      isCompleted: reached,
      isCurrent: order.deliveryStatus === definition.status,
      ...(activatedAt ? { activatedAt } : {}),
      ...(saved?.note ? { note: saved.note } : {}),
      ...(saved?.actorType ? { updatedBy: saved.actorType } : {}),
      ...(saved?.actorId ? { updatedByUserId: saved.actorId } : {}),
    };
  });

  const exceptionalSteps = [
    { status: OrderDeliveryStatus.canceled, label: "Order cancelled", date: order.cancelledAt },
    { status: OrderDeliveryStatus.returned, label: "Order returned", date: order.returnedAt },
  ].flatMap((definition) => {
    const saved = savedSteps.find((step: any) => step.status === definition.status);
    const activatedAt = dateValue(saved?.timestamp) || dateValue(definition.date);
    if (!activatedAt && order.deliveryStatus !== definition.status) return [];
    return [{
      status: definition.status,
      label: definition.label,
      responsibleParty: "buyer",
      isCompleted: true,
      isCurrent: order.deliveryStatus === definition.status,
      ...(activatedAt ? { activatedAt } : {}),
      ...(saved?.note ? { note: saved.note } : {}),
      ...(saved?.actorType ? { updatedBy: saved.actorType } : {}),
      ...(saved?.actorId ? { updatedByUserId: saved.actorId } : {}),
    }];
  });

  return [...standardSteps, ...exceptionalSteps];
};

const participantRole = (order: any, userId: string): "buyer" | "seller" | null => {
  if (String(order.userId) === String(userId)) return "buyer";
  const isSeller = (order.products || []).some((product: any) => String(product.merchantId) === String(userId));
  return isSeller ? "seller" : null;
};

export const availableOrderActions = (order: any, userId: string) => {
  const role = participantRole(order, userId);
  if (role === "seller" && order.paymentStatus === OrderPaymentStatus.paid && order.deliveryStatus === OrderDeliveryStatus.orderConfirmed) {
    return [OrderDeliveryStatus.outForDelivery];
  }
  if (role === "buyer" && order.deliveryStatus === OrderDeliveryStatus.outForDelivery) {
    return [OrderDeliveryStatus.delivered];
  }
  if (role === "buyer" && order.deliveryStatus === OrderDeliveryStatus.delivered) {
    return [OrderDeliveryStatus.received];
  }
  return [];
};

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

export const fetchOrderByIdForParticipant = async (orderId: string, userId: string) => {
  return await Order.findOne({
    _id: orderId,
    $or: [{ userId }, { products: { $elemMatch: { merchantId: userId } } }],
  });
};

export const orderDetailsForParticipant = (order: any, userId: string) => {
  const value = typeof order.toObject === "function" ? order.toObject() : { ...order };
  const viewerRole = participantRole(value, userId);
  return {
    ...value,
    viewerRole,
    allowedDeliveryStatusUpdates: availableOrderActions(value, userId),
    orderSteps: buildOrderSteps(value),
  };
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

export const fetchSalesForSeller = async (
  sellerId: string,
  {
    page = 1,
    limit = 10,
    sortBy = "latest",
    status,
    paymentStatus,
    search,
  }: {
    page?: number;
    limit?: number;
    sortBy?: string;
    status?: string;
    paymentStatus?: string;
    search?: string;
  },
) => {
  const currentPage = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const sellerObjectId = new Types.ObjectId(sellerId);
  const lineMatch: Record<string, unknown> = { "products.merchantId": sellerObjectId };
  if (status) lineMatch.deliveryStatus = status;
  if (paymentStatus) lineMatch.paymentStatus = paymentStatus;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    latest: { createdAt: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
    total_high_low: { saleTotal: -1, createdAt: -1 },
    total_low_high: { saleTotal: 1, createdAt: -1 },
  };
  const normalizedSearch = String(search || "").trim();
  const searchMatch: Record<string, unknown>[] = normalizedSearch
    ? [
        { "products.productName": { $regex: normalizedSearch, $options: "i" } },
        { "products.brand": { $regex: normalizedSearch, $options: "i" } },
        { "products.categoryName": { $regex: normalizedSearch, $options: "i" } },
        { "buyer.email": { $regex: normalizedSearch, $options: "i" } },
        { "buyer.firstName": { $regex: normalizedSearch, $options: "i" } },
        { "buyer.lastName": { $regex: normalizedSearch, $options: "i" } },
        { "buyer.userName": { $regex: normalizedSearch, $options: "i" } },
      ]
    : [];
  if (normalizedSearch && Types.ObjectId.isValid(normalizedSearch)) {
    searchMatch.push({ _id: new Types.ObjectId(normalizedSearch) });
  }

  const pipeline: PipelineStage[] = [
    { $match: { "products.merchantId": sellerObjectId } },
    { $unwind: "$products" },
    { $match: lineMatch },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "buyer",
      },
    },
    { $unwind: { path: "$buyer", preserveNullAndEmptyArrays: true } },
    ...(searchMatch.length ? [{ $match: { $or: searchMatch } } as PipelineStage.Match] : []),
    {
      $addFields: {
        lineSubtotal: { $multiply: ["$products.quantity", "$products.price"] },
        saleTotal: {
          $add: [
            { $subtract: [{ $multiply: ["$products.quantity", "$products.price"] }, { $ifNull: ["$products.discountAmount", 0] }] },
            { $ifNull: ["$products.taxAmount", 0] },
          ],
        },
      },
    },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        rows: [
          { $sort: sortMap[sortBy] || sortMap.latest },
          { $skip: (currentPage - 1) * pageSize },
          { $limit: pageSize },
        ],
      },
    },
  ];

  const [result] = await Order.aggregate(pipeline);
  const total = Number(result?.metadata?.[0]?.total || 0);
  const sales = (result?.rows || []).map((row: any) => {
    const buyerName = [row.buyer?.firstName, row.buyer?.lastName].filter(Boolean).join(" ")
      || row.buyer?.fullName
      || row.buyer?.userName
      || "Buyer";
    const orderForActions = { ...row, products: [row.products] };
    const steps = buildOrderSteps(orderForActions);
    const activeStep = [...steps].reverse().find((step: any) => step.isCompleted);
    const lineSubtotal = Number(row.lineSubtotal || 0);
    const discountAmount = Number(row.products?.discountAmount || 0);
    const taxAmount = Number(row.products?.taxAmount || 0);
    return {
      saleId: String(row.products?._id || `${row._id}:${row.products?.productId}`),
      orderId: row._id,
      orderNumber: String(row._id),
      orderDate: row.createdAt,
      quantity: Number(row.products?.quantity || 0),
      quantityMetric: row.products?.quantityMetric || "unit",
      paymentStatus: row.paymentStatus,
      deliveryStatus: row.deliveryStatus,
      deliveryDate: row.deliveryDate || null,
      deliveredAt: row.deliveredAt || null,
      deliveryAddress: row.shippingAddress || null,
      product: {
        id: row.products?.productId,
        name: row.products?.productName,
        brand: row.products?.brand,
        category: row.products?.categoryName,
        thumbnail: row.products?.thumbnail,
        unitPrice: Number(row.products?.price || 0),
      },
      pricing: {
        currency: row.products?.currency || "NGN",
        subtotalAmount: lineSubtotal,
        discountAmount,
        taxAmount,
        totalAmount: Number(row.saleTotal || lineSubtotal - discountAmount + taxAmount),
      },
      buyer: {
        id: row.buyer?._id || row.userId,
        name: buyerName,
        email: row.buyer?.email || null,
        phone: row.buyer?.mobile || null,
        image: row.buyer?.displayImage || null,
      },
      latestStep: activeStep || null,
      orderSteps: steps,
      allowedDeliveryStatusUpdates: availableOrderActions(orderForActions, sellerId),
    };
  });
  const totalPages = Math.ceil(total / pageSize) || 1;
  return {
    sales,
    pagination: {
      total,
      currentPage,
      pageSize,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
    filters: {
      sortBy: sortBy in sortMap ? sortBy : "latest",
      status: status || null,
      paymentStatus: paymentStatus || null,
      search: normalizedSearch || null,
    },
  };
};

export const pushDeliveryStep = async (
  orderId: string,
  status: OrderDeliveryStatus,
  note?: string,
  actorType?: OrderActorType,
  actorId?: string,
) => {
  return await Order.findByIdAndUpdate(
    orderId,
    {
      $set: { deliveryStatus: status },
      $push: { deliverySteps: { status, timestamp: new Date(), note: note || undefined, actorType, actorId } },
    },
    { new: true }
  );
};

export const updateOrderDeliveryStatus = async (
  orderId: string,
  userId: string,
  nextStatus: OrderDeliveryStatus,
  note?: string,
) => {
  const order = await fetchOrderByIdForParticipant(orderId, userId);
  if (!order) throw new BadRequestError("Order not found");

  const role = participantRole(order, userId);
  const allowed = availableOrderActions(order, userId);
  if (!role || !allowed.includes(nextStatus)) {
    if (nextStatus === OrderDeliveryStatus.outForDelivery && role !== "seller") {
      throw new ForbiddenError("Only a seller on this order can mark it as out for delivery");
    }
    if (nextStatus === OrderDeliveryStatus.delivered && role !== "buyer") {
      throw new ForbiddenError("Only the buyer can confirm that this order was delivered");
    }
    if (nextStatus === OrderDeliveryStatus.received && role !== "buyer") {
      throw new ForbiddenError("Only the buyer can confirm that this order was received");
    }
    if (nextStatus === OrderDeliveryStatus.outForDelivery && order.paymentStatus !== OrderPaymentStatus.paid) {
      throw new BadRequestError("An order must be paid before it can be sent for delivery");
    }
    throw new BadRequestError(`Order cannot move from "${order.deliveryStatus}" to "${nextStatus}"`);
  }

  const now = new Date();
  const expectedStatus = nextStatus === OrderDeliveryStatus.outForDelivery
    ? OrderDeliveryStatus.orderConfirmed
    : nextStatus === OrderDeliveryStatus.delivered
      ? OrderDeliveryStatus.outForDelivery
      : OrderDeliveryStatus.delivered;
  const update: any = {
    $set: {
      deliveryStatus: nextStatus,
      ...(nextStatus === OrderDeliveryStatus.delivered && {
        deliveredAt: now,
        status: OrderStatus.completed,
      }),
      ...(nextStatus === OrderDeliveryStatus.received && { receivedAt: now }),
    },
    $push: {
      deliverySteps: {
        status: nextStatus,
        timestamp: now,
        note: note || undefined,
        actorType: role,
        actorId: userId,
      },
    },
  };
  const updated = await Order.findOneAndUpdate(
    { _id: orderId, deliveryStatus: expectedStatus },
    update,
    { new: true }
  );
  if (!updated) throw new BadRequestError("The order status changed. Refresh the order and try again");
  return orderDetailsForParticipant(updated, userId);
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
          actorType: "buyer",
          actorId: userId,
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

  if (![OrderDeliveryStatus.delivered, OrderDeliveryStatus.received].includes(order.deliveryStatus as OrderDeliveryStatus)) {
    throw new BadRequestError("Order can only be returned after delivery or receipt confirmation");
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
          actorType: "buyer",
          actorId: userId,
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

  if (![OrderDeliveryStatus.delivered, OrderDeliveryStatus.received].includes(order.deliveryStatus as OrderDeliveryStatus)) {
    throw new BadRequestError("Reorder is only available for delivered or received orders");
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
