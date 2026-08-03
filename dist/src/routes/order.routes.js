"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRoute = void 0;
const express_1 = require("express");
const orderController = __importStar(require("../controllers/order.controller"));
const current_user_1 = require("../middlewares/current-user");
const order_validation_1 = require("../validations/order.validation");
const router = (0, express_1.Router)();
exports.OrderRoute = router;
router.route("/").get(current_user_1.userAuth, order_validation_1.validateListOrders, orderController.getMyOrdersController);
router.route("/bulk-cancel").post(current_user_1.userAuth, order_validation_1.validateBulkCancel, orderController.bulkCancelOrdersController);
router.route("/:id").get(current_user_1.userAuth, orderController.getOrderByIdController);
router.route("/:id/cancel").post(current_user_1.userAuth, order_validation_1.validateReason, orderController.cancelOrderController);
router.route("/:id/return").post(current_user_1.userAuth, order_validation_1.validateReason, orderController.returnOrderController);
router.route("/:id/reorder").post(current_user_1.userAuth, orderController.reorderController);
router.route("/:id/rate-merchant").post(current_user_1.userAuth, order_validation_1.validateRateMerchant, orderController.rateMerchantController);
router.route("/:id/track").get(current_user_1.userAuth, orderController.trackOrderController);
