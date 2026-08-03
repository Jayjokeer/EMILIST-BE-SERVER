import { JwtPayload } from "jsonwebtoken";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../errors/error-handler";
import { successResponse } from "../helpers/success-response";
import { BadRequestError, NotFoundError } from "../errors/error";
import * as orderService from "../services/order.service";
import * as reviewService from "../services/review.service";

export const getMyOrdersController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { page, limit, sortBy, status } = req.query;
  const data = await orderService.fetchOrdersForUser(userId, {
    page: Number(page),
    limit: Number(limit),
    sortBy: sortBy as string,
    status: status as string,
  });
  return successResponse(res, StatusCodes.OK, data);
});

export const getOrderByIdController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { id } = req.params;
  const order = await orderService.fetchOrderByIdAndUser(id, userId);
  if (!order) throw new NotFoundError("Order not found");
  return successResponse(res, StatusCodes.OK, order);
});

export const cancelOrderController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { reason } = req.body;
  const order = await orderService.cancelOrder(id, userId, reason);
  return successResponse(res, StatusCodes.OK, order);
});

export const returnOrderController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { reason } = req.body;
  const order = await orderService.returnOrder(id, userId, reason);
  return successResponse(res, StatusCodes.OK, order);
});

export const reorderController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { id } = req.params;
  const cart = await orderService.createReorderCart(id, userId);
  return successResponse(res, StatusCodes.CREATED, cart);
});

export const rateMerchantController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { id } = req.params;
  const { productId, rating, comment } = req.body;

  const order = await orderService.fetchOrderByIdAndUser(id, userId);
  if (!order) throw new NotFoundError("Order not found");

  const orderProduct = (order.products || []).find(
    (p: any) => String(p.productId) === String(productId)
  );
  if (!orderProduct) {
    throw new BadRequestError("You cannot rate a product you did not purchase in this order");
  }

  const isReviewed = await reviewService.isUserReviewed(productId, userId);
  if (isReviewed) {
    throw new BadRequestError("You have previously reviewed this product");
  }

  const data = await reviewService.addReview({ productId, userId, rating, comment });
  return successResponse(res, StatusCodes.CREATED, data);
});

export const trackOrderController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { id } = req.params;
  const order = await orderService.fetchOrderByIdAndUser(id, userId);
  if (!order) throw new NotFoundError("Order not found");

  return successResponse(res, StatusCodes.OK, {
    deliveryStatus: order.deliveryStatus,
    deliveryDate: order.deliveryDate,
    deliveredAt: order.deliveredAt,
    timeline: order.deliverySteps || [],
  });
});

export const bulkCancelOrdersController = catchAsync(async (req: JwtPayload, res: Response) => {
  const userId = req.user._id;
  const { orderIds } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    throw new BadRequestError("orderIds must be a non-empty array");
  }

  const results = [];
  for (const orderId of orderIds) {
    try {
      await orderService.cancelOrder(orderId, userId);
      results.push({ orderId, success: true, message: "Order cancelled" });
    } catch (error: any) {
      results.push({
        orderId,
        success: false,
        message: error?.message || "Order could not be cancelled",
      });
    }
  }

  return successResponse(res, StatusCodes.OK, results);
});