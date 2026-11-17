import test from "node:test";
import assert from "node:assert/strict";
import { validateFetchJobsByStatus } from "../src/validations/job.validation";

test("fetch jobs by status accepts and converts pagination query parameters", () => {
  const req: any = {
    query: { status: "active", page: "2", limit: "25", orderBy: "oldest" },
  };
  let nextCalled = false;

  validateFetchJobsByStatus(req, {} as any, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.query.page, 2);
  assert.equal(req.query.limit, 25);
  assert.equal(req.query.orderBy, "oldest");
});

test("fetch jobs by status applies pagination defaults", () => {
  const req: any = { query: { status: "active" } };
  let nextCalled = false;

  validateFetchJobsByStatus(req, {} as any, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.query.page, 1);
  assert.equal(req.query.limit, 10);
  assert.equal(req.query.orderBy, "newest");
});

test("fetch jobs by status rejects an invalid page or excessive limit", () => {
  const req: any = { query: { status: "active", page: "0", limit: "101" } };
  let statusCode: number | undefined;
  let responseBody: any;
  const res: any = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: any) {
      responseBody = body;
      return this;
    },
  };

  validateFetchJobsByStatus(req, res, () => {
    throw new Error("next must not be called for an invalid query");
  });

  assert.equal(statusCode, 400);
  assert.equal(responseBody.errors.length, 2);
});
