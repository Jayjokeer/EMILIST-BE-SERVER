"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const order_enum_1 = require("../src/enums/order.enum");
const order_model_1 = __importDefault(require("../src/models/order.model"));
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
    strict_1.default.equal(steps.length, 4);
    strict_1.default.equal(steps[0].status, order_enum_1.OrderDeliveryStatus.orderConfirmed);
    strict_1.default.ok("activatedAt" in steps[0]);
    strict_1.default.equal(steps[1].updatedBy, "seller");
    strict_1.default.equal(steps[1].isCurrent, true);
    strict_1.default.equal(steps[2].isCompleted, false);
    strict_1.default.equal("activatedAt" in steps[2], false);
    strict_1.default.equal(steps[3].status, order_enum_1.OrderDeliveryStatus.received);
    strict_1.default.equal(steps[3].isCompleted, false);
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
(0, node_test_1.default)("only the buyer can confirm receipt after delivery", () => {
    const order = {
        userId: buyerId,
        products: [{ merchantId: sellerId }],
        paymentStatus: order_enum_1.OrderPaymentStatus.paid,
        deliveryStatus: order_enum_1.OrderDeliveryStatus.delivered,
    };
    strict_1.default.deepEqual((0, order_service_1.availableOrderActions)(order, buyerId), [order_enum_1.OrderDeliveryStatus.received]);
    strict_1.default.deepEqual((0, order_service_1.availableOrderActions)(order, sellerId), []);
});
(0, node_test_1.default)("received order timeline records the receipt timestamp", () => {
    const receivedAt = new Date("2026-11-21T08:30:00.000Z");
    const steps = (0, order_service_1.buildOrderSteps)({
        userId: buyerId,
        createdAt: new Date("2026-11-20T09:00:00.000Z"),
        deliveredAt: new Date("2026-11-20T15:00:00.000Z"),
        receivedAt,
        deliveryStatus: order_enum_1.OrderDeliveryStatus.received,
        deliverySteps: [{ status: order_enum_1.OrderDeliveryStatus.received, timestamp: receivedAt, actorType: "buyer", actorId: buyerId }],
    });
    strict_1.default.equal(steps[3].status, order_enum_1.OrderDeliveryStatus.received);
    strict_1.default.equal(steps[3].isCurrent, true);
    strict_1.default.equal(steps[3].activatedAt?.toISOString(), receivedAt.toISOString());
});
(0, node_test_1.default)("seller sales returns seller-owned line details and dispatch action", async () => {
    const originalAggregate = order_model_1.default.aggregate;
    let capturedPipeline = [];
    order_model_1.default.aggregate = async (pipeline) => {
        capturedPipeline = pipeline;
        return [{
                metadata: [{ total: 1 }],
                rows: [{
                        _id: "64e1a2b3c4d5e6f7a8b9c0d4",
                        userId: buyerId,
                        buyer: { _id: buyerId, firstName: "Ada", lastName: "Okafor", email: "ada@example.com" },
                        products: {
                            _id: "64e1a2b3c4d5e6f7a8b9c0d5",
                            productId: "64e1a2b3c4d5e6f7a8b9c0d6",
                            merchantId: sellerId,
                            productName: "Cement",
                            brand: "Dangote",
                            categoryName: "Building Materials",
                            quantity: 15,
                            quantityMetric: "bags",
                            price: 9000,
                            currency: "NGN",
                            discountAmount: 0,
                            taxAmount: 0,
                        },
                        lineSubtotal: 135000,
                        saleTotal: 135000,
                        paymentStatus: order_enum_1.OrderPaymentStatus.paid,
                        deliveryStatus: order_enum_1.OrderDeliveryStatus.orderConfirmed,
                        shippingAddress: "12 Sample Close, Yaba, Lagos",
                        createdAt: new Date("2026-02-17T10:00:00.000Z"),
                        deliverySteps: [],
                    }],
            }];
    };
    try {
        const result = await (0, order_service_1.fetchSalesForSeller)(sellerId, { page: 1, limit: 10, sortBy: "latest" });
        strict_1.default.equal(result.pagination.total, 1);
        strict_1.default.equal(result.sales[0].buyer.name, "Ada Okafor");
        strict_1.default.equal(result.sales[0].pricing.totalAmount, 135000);
        strict_1.default.deepEqual(result.sales[0].allowedDeliveryStatusUpdates, [order_enum_1.OrderDeliveryStatus.outForDelivery]);
        strict_1.default.ok(capturedPipeline.some((stage) => stage.$unwind === "$products"));
    }
    finally {
        order_model_1.default.aggregate = originalAggregate;
    }
});
