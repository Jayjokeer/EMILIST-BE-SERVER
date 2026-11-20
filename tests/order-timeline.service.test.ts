import assert from "node:assert/strict";
import test from "node:test";
import { OrderDeliveryStatus, OrderPaymentStatus } from "../src/enums/order.enum";
import { availableOrderActions, buildOrderSteps } from "../src/services/order.service";

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

  assert.equal(steps.length, 3);
  assert.equal(steps[0].status, OrderDeliveryStatus.orderConfirmed);
  assert.ok("activatedAt" in steps[0]);
  assert.equal(steps[1].updatedBy, "seller");
  assert.equal(steps[1].isCurrent, true);
  assert.equal(steps[2].isCompleted, false);
  assert.equal("activatedAt" in steps[2], false);
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
