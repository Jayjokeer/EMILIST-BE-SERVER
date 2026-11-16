import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import Wallet from "../src/models/wallet.model";
import Transaction from "../src/models/transaction.model";
import * as jobService from "../src/services/job.service";
import { paystackWebhookController } from "../src/controllers/webhook.controller";
import { config } from "../src/utils/config";
import {
  PaymentMethodEnum,
  ServiceEnum,
  TransactionEnum,
  TransactionType,
} from "../src/enums/transaction.enum";

const invokePaystackWebhook = async (event: object, signatureIsValid = true) => {
  const body = Buffer.from(JSON.stringify(event));
  const signature = signatureIsValid
    ? crypto.createHmac("sha512", config.paystackSecretKey).update(body).digest("hex")
    : "invalid-signature";
  let statusCode = 0;
  let responseBody: any;
  const req: any = { body, headers: { "x-paystack-signature": signature } };
  const res: any = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: any) {
      responseBody = payload;
      return this;
    },
  };

  await paystackWebhookController(req, res);
  return { statusCode, responseBody };
};

test("simulates wallet funding and job payment through duplicate Paystack webhooks", async (t) => {
  const originalSecret = config.paystackSecretKey;
  const originalTransactionFindOne = (Transaction as any).findOne;
  const originalWalletUpdateOne = (Wallet as any).updateOne;
  const originalWalletFindById = (Wallet as any).findById;
  const originalFetchJobById = (jobService as any).fetchJobById;
  config.paystackSecretKey = "payment-flow-simulation-secret";

  const wallet: any = {
    _id: "wallet-1",
    balance: 10_000,
    appliedAdjustments: [] as string[],
  };
  const walletTransaction: any = {
    _id: "wallet-transaction-1",
    reference: "PS-WALLET-SIMULATION",
    type: TransactionType.CREDIT,
    serviceType: ServiceEnum.walletFunding,
    paymentMethod: PaymentMethodEnum.card,
    walletId: wallet._id,
    amount: 25_000,
    status: TransactionEnum.pending,
    saveCount: 0,
    async save() { this.saveCount += 1; return this; },
  };
  const job: any = {
    _id: "job-1",
    saveCount: 0,
    milestones: [{
      _id: "milestone-1",
      paymentStatus: "unpaid",
      paymentInfo: {},
      invoice: { invoiceRaised: true, reviewStatus: "pending" },
    }],
    async save() { this.saveCount += 1; return this; },
  };
  const jobTransaction: any = {
    _id: "job-transaction-1",
    reference: "PS-JOB-SIMULATION",
    type: TransactionType.DEBIT,
    serviceType: ServiceEnum.job,
    paymentMethod: PaymentMethodEnum.card,
    jobId: job._id,
    milestoneId: "milestone-1",
    amount: 40_000,
    status: TransactionEnum.pending,
    saveCount: 0,
    async save() { this.saveCount += 1; return this; },
  };
  const transactions = new Map([
    [walletTransaction.reference, walletTransaction],
    [jobTransaction.reference, jobTransaction],
  ]);

  (Transaction as any).findOne = async ({ reference }: any) => transactions.get(reference) || null;
  (Wallet as any).updateOne = async (_filter: any, update: any) => {
    const reference = update.$addToSet.appliedAdjustments;
    if (!wallet.appliedAdjustments.includes(reference)) {
      wallet.balance += update.$inc.balance;
      wallet.appliedAdjustments.push(reference);
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  };
  (Wallet as any).findById = async (walletId: string) => walletId === wallet._id ? wallet : null;
  (jobService as any).fetchJobById = async (jobId: string) => jobId === job._id ? job : null;

  t.after(() => {
    config.paystackSecretKey = originalSecret;
    (Transaction as any).findOne = originalTransactionFindOne;
    (Wallet as any).updateOne = originalWalletUpdateOne;
    (Wallet as any).findById = originalWalletFindById;
    (jobService as any).fetchJobById = originalFetchJobById;
  });

  const invalid = await invokePaystackWebhook({
    event: "charge.success",
    data: { reference: walletTransaction.reference },
  }, false);
  assert.equal(invalid.statusCode, 401);
  assert.equal(wallet.balance, 10_000);

  const walletEvent = { event: "charge.success", data: { reference: walletTransaction.reference } };
  assert.equal((await invokePaystackWebhook(walletEvent)).statusCode, 200);
  assert.equal(walletTransaction.status, TransactionEnum.completed);
  assert.equal(walletTransaction.balanceAfter, 35_000);
  assert.equal(wallet.balance, 35_000);
  assert.deepEqual(wallet.appliedAdjustments, [walletTransaction.reference]);

  assert.equal((await invokePaystackWebhook(walletEvent)).statusCode, 200);
  assert.equal(wallet.balance, 35_000, "duplicate webhook must not credit the wallet twice");
  assert.equal(walletTransaction.saveCount, 1);

  const jobEvent = { event: "charge.success", data: { reference: jobTransaction.reference } };
  assert.equal((await invokePaystackWebhook(jobEvent)).statusCode, 200);
  assert.equal(jobTransaction.status, TransactionEnum.completed);
  assert.ok(jobTransaction.dateCompleted instanceof Date);
  assert.equal(job.milestones[0].paymentStatus, "paid");
  assert.equal(job.milestones[0].invoice.reviewStatus, "paid");
  assert.equal(job.milestones[0].paymentInfo.amountPaid, 40_000);
  assert.equal(job.milestones[0].paymentInfo.paymentMethod, PaymentMethodEnum.card);

  assert.equal((await invokePaystackWebhook(jobEvent)).statusCode, 200);
  assert.equal(job.saveCount, 1, "duplicate webhook must not reapply the job payment");
  assert.equal(jobTransaction.saveCount, 1);
});
