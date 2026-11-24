import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { userAuth } from "../middlewares/current-user";
import {
  validateBulkCancel,
  validateListSales,
  validateListOrders,
  validateRateMerchant,
  validateReason,
  validateUpdateDeliveryStatus,
} from "../validations/order.validation";
import { applyOrderDeliveryImage, orderDeliveryImageUpload } from "../utils/image-upload";

const router = Router();

router.route("/").get(userAuth, validateListOrders, orderController.getMyOrdersController);
router.route("/bulk-cancel").post(userAuth, validateBulkCancel, orderController.bulkCancelOrdersController);
router.route("/sales").get(userAuth, validateListSales, orderController.getMySalesController);
router.route("/:id").get(userAuth, orderController.getOrderByIdController);
router.route("/:id/status").patch(userAuth, orderDeliveryImageUpload, applyOrderDeliveryImage, validateUpdateDeliveryStatus, orderController.updateOrderStatusController);
router.route("/:id/cancel").post(userAuth, validateReason, orderController.cancelOrderController);
router.route("/:id/return").post(userAuth, validateReason, orderController.returnOrderController);
router.route("/:id/reorder").post(userAuth, orderController.reorderController);
router.route("/:id/rate-merchant").post(userAuth, validateRateMerchant, orderController.rateMerchantController);
router.route("/:id/track").get(userAuth, orderController.trackOrderController);

export { router as OrderRoute };
