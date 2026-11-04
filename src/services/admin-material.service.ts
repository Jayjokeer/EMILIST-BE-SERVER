import { Types } from "mongoose";
import { BadRequestError, NotFoundError } from "../errors/error";
import Product from "../models/product.model";
import Order from "../models/order.model";
import Review from "../models/review.model";
import Users from "../models/users.model";
import AdminAction from "../models/admin-action.model";
import { OrderDeliveryStatus } from "../enums/order.enum";
import * as orderService from "./order.service";
import { overviewRange, percentageChange } from "./admin-overview.service";

export const adminMaterialPagination = (pageValue: unknown, limitValue: unknown) => {
  const page = Math.max(1, Number(pageValue) || 1);
  const limit = Math.min(100, Math.max(1, Number(limitValue) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const assertId = (value: string, label: string) => {
  if (!Types.ObjectId.isValid(value)) throw new BadRequestError(`Invalid ${label}`);
};

export const materialStockStatus = (product: any) => {
  if (product.status === "inactive" || product.moderation?.isDelisted) return "delisted";
  if (Number(product.availableQuantity) <= 0 || product.status === "sold_out") return "out_of_stock";
  const lowStockAt = Math.max(10, Number(product.minimumOrder) || 1);
  if (Number(product.availableQuantity) <= lowStockAt) return "low_stock";
  if (product.status === "active") return "listed";
  return product.status;
};

const materialComparison = async (model: any, filter: any, dateField: string, range: ReturnType<typeof overviewRange>) => {
  const [current, previous] = await Promise.all([
    model.countDocuments({ ...filter, [dateField]: { $gte: range.currentStart, $lte: range.currentEnd } }),
    model.countDocuments({ ...filter, [dateField]: { $gte: range.previousStart, $lt: range.previousEnd } }),
  ]);
  return { current, previous, percentageChange: percentageChange(current, previous) };
};

export const fetchAdminMaterialSummary = async (rangeValue?: string) => {
  const range = overviewRange(rangeValue);
  const [activeListings, newOrders, deliveriesInProgress, returnedOrders, cancelledOrders, comparisons] = await Promise.all([
    Product.countDocuments({ status: "active", isDeleted: false }),
    Order.countDocuments({ createdAt: { $gte: range.currentStart, $lte: range.currentEnd } }),
    Order.countDocuments({ deliveryStatus: OrderDeliveryStatus.outForDelivery }),
    Order.countDocuments({ deliveryStatus: OrderDeliveryStatus.returned }),
    Order.countDocuments({ deliveryStatus: OrderDeliveryStatus.canceled }),
    Promise.all([
      materialComparison(Product, { status: "active", isDeleted: false }, "createdAt", range),
      materialComparison(Order, {}, "createdAt", range),
      materialComparison(Order, { deliveryStatus: OrderDeliveryStatus.outForDelivery }, "createdAt", range),
      materialComparison(Order, { deliveryStatus: OrderDeliveryStatus.returned }, "returnedAt", range),
      materialComparison(Order, { deliveryStatus: OrderDeliveryStatus.canceled }, "cancelledAt", range),
    ]),
  ]);
  return {
    range: range.range,
    activeListings, newOrders, deliveriesInProgress, returnedOrders, cancelledOrders,
    changes: {
      activeListings: comparisons[0], newOrders: comparisons[1], deliveriesInProgress: comparisons[2],
      returnedOrders: comparisons[3], cancelledOrders: comparisons[4],
    },
  };
};

const productFilter = async (query: any) => {
  const filter: any = { isDeleted: false };
  if (query.category && Types.ObjectId.isValid(String(query.category))) filter.category = query.category;
  if (query.merchantId && Types.ObjectId.isValid(String(query.merchantId))) filter.userId = query.merchantId;
  if (query.status) {
    switch (String(query.status)) {
      case "listed": filter.status = "active"; filter.availableQuantity = { $gt: 10 }; break;
      case "low_stock":
        filter.status = "active";
        filter.availableQuantity = { $gt: 0 };
        filter.$expr = { $lte: ["$availableQuantity", { $max: [10, { $ifNull: ["$minimumOrder", 1] }] }] };
        break;
      case "out_of_stock": filter.$or = [{ status: "sold_out" }, { availableQuantity: { $lte: 0 } }]; break;
      case "delisted": filter.$or = [{ status: "inactive" }, { "moderation.isDelisted": true }]; break;
      default: filter.status = query.status;
    }
  }
  const search = String(query.search || "").trim();
  if (search) {
    const merchants = await Users.find({ $or: [
      { firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } },
      { userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } },
    ] }).select("_id").lean();
    const searchFilter = { $or: [
      { name: { $regex: search, $options: "i" } }, { brand: { $regex: search, $options: "i" } },
      { merchantName: { $regex: search, $options: "i" } }, { userId: { $in: merchants.map((item: any) => item._id) } },
      ...(Types.ObjectId.isValid(search) ? [{ _id: new Types.ObjectId(search) }] : []),
    ] };
    filter.$and = [...(filter.$and || []), searchFilter];
  }
  return filter;
};

export const fetchAdminMaterials = async (query: any) => {
  const { page, limit, skip } = adminMaterialPagination(query.page, query.limit);
  const filter = await productFilter(query);
  const [products, total] = await Promise.all([
    Product.find(filter).populate("userId", "firstName lastName userName uniqueId email displayImage")
      .populate("category", "name").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  return {
    products: products.map((product: any) => ({
      id: product._id, listedAt: product.createdAt, name: product.name,
      image: product.images?.find((image: any) => image.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || null,
      merchant: product.userId, category: product.category, price: product.discountedPrice ?? product.price,
      currency: product.currency, priceMetric: product.priceMetric, stock: product.availableQuantity,
      quantityMetric: product.quantityMetric, quantitySold: product.totalUnitsSold || 0,
      status: materialStockStatus(product),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const reviewData = async (productId: Types.ObjectId, merchantId: any, query: any = {}) => {
  const { page, limit, skip } = adminMaterialPagination(query.page || 1, query.limit || 10);
  const reviewFilter: any = { productId };
  if (query.search) reviewFilter.comment = { $regex: String(query.search), $options: "i" };
  const merchantProducts = await Product.find({ userId: merchantId, isDeleted: false }).select("_id").lean();
  const [reviews, total, distributionRows, merchantRows] = await Promise.all([
    Review.find(reviewFilter).populate("userId", "firstName lastName userName uniqueId displayImage")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments(reviewFilter),
    Review.aggregate([{ $match: { productId } }, { $group: { _id: "$rating", count: { $sum: 1 } } }]),
    Review.aggregate([
      { $match: { productId: { $in: merchantProducts.map((item: any) => item._id) } } },
      { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
  ]);
  const distribution = Object.fromEntries(distributionRows.map((row: any) => [row._id, row.count]));
  const allRatings = distributionRows.reduce((sum: number, row: any) => sum + row.count, 0);
  const weighted = distributionRows.reduce((sum: number, row: any) => sum + Number(row._id) * row.count, 0);
  return {
    averageRating: allRatings ? Number((weighted / allRatings).toFixed(2)) : 0,
    reviewCount: allRatings,
    ratingDistribution: { 5: distribution[5] || 0, 4: distribution[4] || 0, 3: distribution[3] || 0, 2: distribution[2] || 0, 1: distribution[1] || 0 },
    merchantRating: Number((merchantRows[0]?.average || 0).toFixed(2)),
    merchantReviewCount: merchantRows[0]?.count || 0,
    reviews,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const fetchProduct = async (productId: string) => {
  assertId(productId, "product id");
  const product: any = await Product.findById(productId)
    .populate("userId", "firstName lastName userName uniqueId email displayImage houseAddress city state country")
    .populate("category", "name").lean();
  if (!product) throw new NotFoundError("Material listing not found");
  return product;
};

export const fetchAdminMaterialDetails = async (productId: string, query: any) => {
  const product: any = await fetchProduct(productId);
  const ratings = await reviewData(product._id, product.userId?._id || product.userId, query);
  return {
    ...product,
    listingStatus: materialStockStatus(product),
    stock: { available: product.availableQuantity, metric: product.quantityMetric, sold: product.totalUnitsSold || 0 },
    ratings,
  };
};

export const fetchAdminMaterialReviews = async (productId: string, query: any) => {
  const product: any = await fetchProduct(productId);
  return reviewData(product._id, product.userId?._id || product.userId, query);
};

export const delistAdminMaterial = async (productId: string, adminId: string, reason: string) => {
  assertId(productId, "product id");
  const product: any = await Product.findById(productId);
  if (!product) throw new NotFoundError("Material listing not found");
  if (product.status === "inactive" && product.moderation?.isDelisted) throw new BadRequestError("Material is already de-listed");
  const previousState = { status: product.status, moderation: product.moderation };
  product.status = "inactive";
  product.moderation = { isDelisted: true, reason, adminId, delistedAt: new Date() };
  await product.save();
  await AdminAction.create({
    adminId, targetUserId: product.userId, targetType: "product", targetId: product._id,
    action: "product.delisted", reason, previousState,
    newState: { status: product.status, moderation: product.moderation },
  });
  return fetchAdminMaterialDetails(productId, {});
};

const orderFilter = async (query: any, productId?: string) => {
  const filter: any = {};
  if (productId) {
    assertId(productId, "product id");
    filter["products.productId"] = productId;
  }
  if (query.deliveryStatus) filter.deliveryStatus = query.deliveryStatus;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  const search = String(query.search || "").trim();
  if (search) {
    const users = await Users.find({ $or: [
      { firstName: { $regex: search, $options: "i" } }, { lastName: { $regex: search, $options: "i" } },
      { userName: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } },
    ] }).select("_id").lean();
    filter.$or = [
      { userId: { $in: users.map((item: any) => item._id) } },
      { "products.merchantId": { $in: users.map((item: any) => item._id) } },
      { "products.productName": { $regex: search, $options: "i" } },
      { "products.merchantName": { $regex: search, $options: "i" } },
      ...(Types.ObjectId.isValid(search) ? [{ _id: new Types.ObjectId(search) }] : []),
    ];
  }
  return filter;
};

export const fetchAdminMaterialOrders = async (query: any, productId?: string) => {
  const { page, limit, skip } = adminMaterialPagination(query.page, query.limit);
  const filter = await orderFilter(query, productId);
  const [orders, total] = await Promise.all([
    Order.find(filter).populate("userId", "firstName lastName userName uniqueId email displayImage houseAddress city state country")
      .populate("products.merchantId", "firstName lastName userName uniqueId email displayImage")
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  const rows = orders.flatMap((order: any) => order.products
    .filter((item: any) => !productId || String(item.productId) === productId)
    .map((item: any) => ({
      orderId: order._id, orderDate: order.createdAt, buyer: order.userId,
      productId: item.productId, productName: item.productName, thumbnail: item.thumbnail,
      merchant: item.merchantId || { name: item.merchantName }, quantity: item.quantity,
      quantityMetric: item.quantityMetric, salePrice: item.price * item.quantity,
      unitPrice: item.price, paymentStatus: order.paymentStatus, deliveryStatus: order.deliveryStatus,
    })));
  return { orders: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const fetchAdminMaterialOrderDetails = async (orderId: string, query: any) => {
  assertId(orderId, "order id");
  const order: any = await Order.findById(orderId)
    .populate("userId", "firstName lastName userName uniqueId email displayImage houseAddress city state country")
    .populate("products.productId")
    .populate("products.merchantId", "firstName lastName userName uniqueId email displayImage")
    .lean();
  if (!order) throw new NotFoundError("Order not found");
  const selected = query.productId
    ? order.products.find((item: any) => String(item.productId?._id || item.productId) === String(query.productId))
    : order.products[0];
  if (!selected) throw new NotFoundError("Product is not part of this order");
  const productId = selected.productId?._id || selected.productId;
  const ratings = productId ? await reviewData(productId, selected.merchantId?._id || selected.merchantId, query) : null;
  return { ...order, selectedProduct: selected, ratings, canInitiateReturn: order.deliveryStatus === OrderDeliveryStatus.delivered };
};

export const initiateAdminOrderReturn = async (orderId: string, adminId: string, reason: string) => {
  assertId(orderId, "order id");
  const order: any = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");
  const previousState = { deliveryStatus: order.deliveryStatus, paymentStatus: order.paymentStatus };
  const returned: any = await orderService.returnOrder(orderId, String(order.userId), reason);
  returned.adminReturn = { initiatedBy: adminId, initiatedAt: new Date(), reason };
  await returned.save();
  await AdminAction.create({
    adminId, targetUserId: order.userId, targetType: "order", targetId: order._id,
    action: "order.return_initiated", reason, previousState,
    newState: { deliveryStatus: returned.deliveryStatus, paymentStatus: returned.paymentStatus },
  });
  return fetchAdminMaterialOrderDetails(orderId, {});
};
