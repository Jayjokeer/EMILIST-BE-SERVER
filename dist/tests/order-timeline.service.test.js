"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const order_enum_1 = require("../src/enums/order.enum");
const order_service_1 = require("../src/services/order.service");
const buyerId = "64e1a2b3c4d5e6f7a8b9c0d1";
const sellerId = "64e1a2b3c4d5e6f7a8b9c0d2";
(0, node_test_1.default)("order timeline includes reached dates and leaves future steps undated", () => {
    const steps = (0, order_service_1.buildOrderSteps)({
        userId: buyerId,
        createdAt: new Date("2026-11-20T09:00:00.000Z"),
        deliveryStatus: order_enum_1.OrderDeliveryStatus.outForDelivery,
        deliverySteps: [{
                status: order_enum_1.OrderDeliveryStatus.outForDelivery,
                timestamp: new Date("2026-11-20T12:00:00.000Z"),
                actorType: "seller",
                actorId: sellerId,
            }],
    });
    strict_1.default.equal(steps.length, 3);
    strict_1.default.equal(steps[0].status, order_enum_1.OrderDeliveryStatus.orderConfirmed);
    strict_1.default.ok("activatedAt" in steps[0]);
    strict_1.default.equal(steps[1].updatedBy, "seller");
    strict_1.default.equal(steps[1].isCurrent, true);
    strict_1.default.equal(steps[2].isCompleted, false);
    strict_1.default.equal("activatedAt" in steps[2], false);
});
(0, node_test_1.default)("only a seller can dispatch a paid confirmed order", () => {
    const order = {
        userId: buyerId,
        products: [{ merchantId: sellerId }],
        paymentStatus: order_enum_1.OrderPaymentStatus.paid,
        deliveryStatus: order_enum_1.OrderDeliveryStatus.orderConfirmed,
    };
    strict_1.default.deepEqual((0, order_service_1.availableOrderActions)(order, sellerId), [order_enum_1.OrderDeliveryStatus.outForDelivery]);
    strict_1.default.deepEqual((0, order_service_1.availableOrderActions)(order, buyerId), []);
});
(0, node_test_1.default)("only the buyer can confirm delivery after dispatch", () => {
    const order = {
        userId: buyerId,
        products: [{ merchantId: sellerId }],
        paymentStatus: order_enum_1.OrderPaymentStatus.paid,
        deliveryStatus: order_enum_1.OrderDeliveryStatus.outForDelivery,
    };
    strict_1.default.deepEqual((0, order_service_1.availableOrderActions)(order, buyerId), [order_enum_1.OrderDeliveryStatus.delivered]);
    strict_1.default.deepEqual((0, order_service_1.availableOrderActions)(order, sellerId), []);
});
