import test from "node:test";
import assert from "node:assert/strict";
import { supportPagination } from "../src/services/support-request.service";

test("support request pagination is bounded and deterministic", () => {
  assert.deepEqual(supportPagination(undefined, undefined), { page: 1, limit: 10, skip: 0 });
  assert.deepEqual(supportPagination("2", "20"), { page: 2, limit: 20, skip: 20 });
  assert.deepEqual(supportPagination("0", "1000"), { page: 1, limit: 100, skip: 0 });
});
