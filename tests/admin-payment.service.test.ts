import test from "node:test";
import assert from "node:assert/strict";
import { TransactionType } from "../src/enums/transaction.enum";
import { adminPaymentDirection, adminPaymentPagination, serializeAdminPayment } from "../src/services/admin-payment.service";

test("admin payment pagination is bounded", () => {
  assert.deepEqual(adminPaymentPagination(undefined, undefined), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(adminPaymentPagination("3", "25"), { page: 3, limit: 25, skip: 50 });
  assert.deepEqual(adminPaymentPagination("-1", "500"), { page: 1, limit: 100, skip: 0 });
});

test("credit and debit ledger entries map to inflow and outflow", () => {
  assert.equal(adminPaymentDirection({ type: TransactionType.CREDIT }), "inflow");
  assert.equal(adminPaymentDirection({ type: TransactionType.DEBIT }), "outflow");
});

test("payment serialization uses explicit counterparty before populated users", () => {
  const payment = serializeAdminPayment({
    _id: "transaction-id", reference: "PYM-123", createdAt: new Date("2026-09-12T12:15:00.000Z"),
    counterparty: "Johnson O. Oluwole", userId: { firstName: "Sender" }, recieverId: { firstName: "Receiver" },
    type: TransactionType.CREDIT, amount: 850000, currency: "NGN", status: "completed",
    paymentMethod: "BankTransfer", description: "Material Sale",
  });
  assert.equal(payment.counterparty, "Johnson O. Oluwole");
  assert.equal(payment.direction, "inflow");
  assert.equal(payment.transactionId, "PYM-123");
});
