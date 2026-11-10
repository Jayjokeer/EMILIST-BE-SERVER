import test from "node:test";
import assert from "node:assert/strict";
import { validatePaymentForJob } from "../src/validations/product.validation";

const baseBody = {
  jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
  milestoneId: "64fb0a1b2c3d4e5f6a7b8c9b",
  paymentMethod: "Wallet",
  currency: "NGN",
};

test('job payment validation converts "false" and permits wallet payment without redirectUrl', () => {
  const req: any = { body: { ...baseBody, isAdditionalAmount: "false" } };
  let nextCalled = false;
  validatePaymentForJob(req, {} as any, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.body.isAdditionalAmount, false);
});

test('job payment validation defaults additional-cost consent to false', () => {
  const req: any = { body: { ...baseBody } };
  let nextCalled = false;
  validatePaymentForJob(req, {} as any, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.body.isAdditionalAmount, false);
});
