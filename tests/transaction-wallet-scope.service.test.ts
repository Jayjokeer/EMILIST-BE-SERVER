import test from "node:test";
import assert from "node:assert/strict";
import { PaymentServiceEnum } from "../src/enums/transaction.enum";
import { buildWalletTransactionScopeCondition, userTransactionDisplayStatus, userTransactionDisplayType } from "../src/services/transaction.service";

const walletId = "6a21f270d23c3015a245cc87";

test("wallet transaction scope includes same-currency external and incoming payments by default", () => {
  const recipientId = "6a21f270d23c3015a245cc84";
  const condition: any = buildWalletTransactionScopeCondition(walletId, "NGN", true, recipientId);

  assert.equal(String(condition.$or[0].walletId), walletId);
  assert.deepEqual(condition.$or[1], {
    walletId: null,
    currency: "NGN",
    paymentService: { $in: Object.values(PaymentServiceEnum) },
  });
  assert.equal(String(condition.$or[2].recieverId), recipientId);
  assert.equal(condition.$or[2].currency, "NGN");
});

test("wallet transaction scope can be restricted to wallet-only payments", () => {
  const condition: any = buildWalletTransactionScopeCondition(walletId, "NGN", false);

  assert.equal(String(condition.walletId), walletId);
  assert.equal(condition.$or, undefined);
});

test("artisan payment status follows pending, processing, and settled lifecycle", () => {
  const artisanId = "6a21f270d23c3015a245cc84";
  const base = { userId: "6ab555c36fc013d4563af969", recieverId: artisanId, serviceType: "Job", type: "DEBIT" };

  assert.equal(userTransactionDisplayStatus({ ...base, status: "pending", isSettled: false }, artisanId), "pending");
  assert.equal(userTransactionDisplayStatus({ ...base, status: "completed", isSettled: false }, artisanId), "processing");
  assert.equal(userTransactionDisplayStatus({ ...base, status: "completed", isSettled: true }, artisanId), "successful");
  assert.equal(userTransactionDisplayType(base, artisanId), "inflow");
});
