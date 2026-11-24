import assert from "node:assert/strict";
import test from "node:test";
import { OrderDeliveryStatus, OrderPaymentStatus } from "../src/enums/order.enum";
import Order from "../src/models/order.model";
import { availableOrderActions, buildOrderSteps, fetchSalesForSeller } from "../src/services/order.service";

const buyerId = "64e1a2b3c4d5e6f7a8b9c0d1";
const sellerId = "64e1a2b3c4d5e6f7a8b9c0d2";

test("order timeline includes reached dates and leaves future steps undated", () => {
  const steps = buildOrderSteps({
    userId: buyerId,
    createdAt: new Date("2026-11-20T09:00:00.000Z"),
    deliveryStatus: OrderDeliveryStatus.outForDelivery,
    deliverySteps: [{
      status: OrderDeliveryStatus.outForDelivery,
      timestamp: new Date("2026-11-20T12:00:00.000Z"),
      actorType: "seller",
      actorId: sellerId,
    }],
  });

  assert.equal(steps.length, 4);
  assert.equal(steps[0].status, OrderDeliveryStatus.orderConfirmed);
  assert.ok("activatedAt" in steps[0]);
  assert.equal(steps[1].updatedBy, "seller");
  assert.equal(steps[1].isCurrent, true);
  assert.equal(steps[2].isCompleted, false);
  assert.equal("activatedAt" in steps[2], false);
  assert.equal(steps[3].status, OrderDeliveryStatus.received);
  assert.equal(steps[3].isCompleted, false);
});

test("only a seller can dispatch a paid confirmed order", () => {
  const order = {
    userId: buyerId,
    products: [{ merchantId: sellerId }],
    paymentStatus: OrderPaymentStatus.paid,
    deliveryStatus: OrderDeliveryStatus.orderConfirmed,
  };
  assert.deepEqual(availableOrderActions(order, sellerId), [OrderDeliveryStatus.outForDelivery]);
  assert.deepEqual(availableOrderActions(order, buyerId), []);
});

test("only the buyer can confirm delivery after dispatch", () => {
  const order = {
    userId: buyerId,
    products: [{ merchantId: sellerId }],
    paymentStatus: OrderPaymentStatus.paid,
    deliveryStatus: OrderDeliveryStatus.outForDelivery,
  };
  assert.deepEqual(availableOrderActions(order, buyerId), [OrderDeliveryStatus.delivered]);
  assert.deepEqual(availableOrderActions(order, sellerId), []);
});

test("only the buyer can confirm receipt after delivery", () => {
  const order = {
    userId: buyerId,
    products: [{ merchantId: sellerId }],
    paymentStatus: OrderPaymentStatus.paid,
    deliveryStatus: OrderDeliveryStatus.delivered,
  };
  assert.deepEqual(availableOrderActions(order, buyerId), [OrderDeliveryStatus.received]);
  assert.deepEqual(availableOrderActions(order, sellerId), []);
});

test("received order timeline records the receipt timestamp", () => {
  const receivedAt = new Date("2026-11-21T08:30:00.000Z");
  const steps = buildOrderSteps({
    userId: buyerId,
    createdAt: new Date("2026-11-20T09:00:00.000Z"),
    deliveredAt: new Date("2026-11-20T15:00:00.000Z"),
    receivedAt,
    deliveryStatus: OrderDeliveryStatus.received,
    deliverySteps: [{ status: OrderDeliveryStatus.received, timestamp: receivedAt, actorType: "buyer", actorId: buyerId }],
  });
  assert.equal(steps[3].status, OrderDeliveryStatus.received);
  assert.equal(steps[3].isCurrent, true);
  assert.equal(steps[3].activatedAt?.toISOString(), receivedAt.toISOString());
});

test("seller sales returns seller-owned line details and dispatch action", async () => {
  const originalAggregate = Order.aggregate;
  let capturedPipeline: any[] = [];
  (Order as any).aggregate = async (pipeline: any[]) => {
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
        paymentStatus: OrderPaymentStatus.paid,
        deliveryStatus: OrderDeliveryStatus.orderConfirmed,
        shippingAddress: "12 Sample Close, Yaba, Lagos",
        createdAt: new Date("2026-02-17T10:00:00.000Z"),
        deliverySteps: [],
      }],
    }];
  };

  try {
    const result = await fetchSalesForSeller(sellerId, { page: 1, limit: 10, sortBy: "latest" });
    assert.equal(result.pagination.total, 1);
    assert.equal(result.sales[0].buyer.name, "Ada Okafor");
    assert.equal(result.sales[0].pricing.totalAmount, 135000);
    assert.deepEqual(result.sales[0].allowedDeliveryStatusUpdates, [OrderDeliveryStatus.outForDelivery]);
    assert.ok(capturedPipeline.some((stage) => stage.$unwind === "$products"));
  } finally {
    (Order as any).aggregate = originalAggregate;
  }
});
