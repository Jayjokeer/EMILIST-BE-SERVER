import test from 'node:test';
import assert from 'node:assert/strict';
import { TransactionType } from '../src/enums/transaction.enum';
import {
  customerPagination,
  customerTransactionDirection,
  walletBalanceChangePercentage,
} from '../src/services/admin-customer.service';

test('customer pagination applies defaults, bounds, and offsets', () => {
  assert.deepEqual(customerPagination(undefined, undefined), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(customerPagination('3', '25'), { page: 3, limit: 25, skip: 50 });
  assert.deepEqual(customerPagination('-2', '500'), { page: 1, limit: 100, skip: 0 });
});

test('received transfers are inflows from the viewed customer perspective', () => {
  assert.equal(customerTransactionDirection({
    userId: 'sender',
    recieverId: 'customer',
    type: TransactionType.DEBIT,
  }, 'customer'), 'inflow');
  assert.equal(customerTransactionDirection({
    userId: 'customer',
    recieverId: 'merchant',
    type: TransactionType.DEBIT,
  }, 'customer'), 'outflow');
  assert.equal(customerTransactionDirection({
    userId: 'customer',
    type: TransactionType.CREDIT,
  }, 'customer'), 'inflow');
});

test('wallet balance change is stable when no historical balance exists', () => {
  assert.equal(walletBalanceChangePercentage(9_450_000, 9_000_000), 5);
  assert.equal(walletBalanceChangePercentage(9_450_000, 0), 0);
  assert.equal(walletBalanceChangePercentage(9_450_000, null), 0);
});
