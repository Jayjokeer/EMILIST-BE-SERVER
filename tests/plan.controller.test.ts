import test from "node:test";
import assert from "node:assert/strict";
import { PlanEnum } from "../src/enums/plan.enum";
import { SubscriptionPeriodEnum } from "../src/enums/suscribtion.enum";
import { serializePlanForDuration } from "../src/controllers/plan.controller";

test("monthly plan responses keep the stored monthly price", () => {
  assert.deepEqual(serializePlanForDuration({ name: PlanEnum.gold, price: 32000 }, SubscriptionPeriodEnum.monthly), {
    name: PlanEnum.gold,
    price: 32000,
    monthlyPrice: 32000,
    billingPeriod: "monthly",
  });
});

test("yearly plan responses calculate twelve months without changing the source", () => {
  const plan = { name: PlanEnum.gold, price: 32000 };
  const result = serializePlanForDuration(plan, SubscriptionPeriodEnum.yearly);
  assert.equal(result.price, 384000);
  assert.equal(result.monthlyPrice, 32000);
  assert.equal(plan.price, 32000);
});

test("the free basic plan remains free for yearly billing", () => {
  assert.equal(serializePlanForDuration({ name: PlanEnum.basic, price: 0 }, SubscriptionPeriodEnum.yearly).price, 0);
});
