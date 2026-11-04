import test from "node:test";
import assert from "node:assert/strict";
import { adminMaterialPagination, materialStockStatus } from "../src/services/admin-material.service";

test("admin material pagination applies safe defaults and bounds", () => {
  assert.deepEqual(adminMaterialPagination(undefined, undefined), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(adminMaterialPagination("3", "25"), { page: 3, limit: 25, skip: 50 });
  assert.deepEqual(adminMaterialPagination("-2", "500"), { page: 1, limit: 100, skip: 0 });
});

test("material status is derived from moderation and stock", () => {
  assert.equal(materialStockStatus({ status: "inactive", availableQuantity: 100 }), "delisted");
  assert.equal(materialStockStatus({ status: "active", availableQuantity: 0 }), "out_of_stock");
  assert.equal(materialStockStatus({ status: "active", availableQuantity: 5 }), "low_stock");
  assert.equal(materialStockStatus({ status: "active", availableQuantity: 100 }), "listed");
  assert.equal(materialStockStatus({ status: "pending", availableQuantity: 100 }), "pending");
});
