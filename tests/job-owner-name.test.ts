import test from "node:test";
import assert from "node:assert/strict";
import { resolveJobOwnerName } from "../src/services/job.service";

test("job owner name uses first and last names", () => {
  assert.equal(
    resolveJobOwnerName({ firstName: "John", lastName: "Doe", userName: "johnny" }),
    "John Doe",
  );
});

test("job owner name supports incomplete legacy profiles", () => {
  assert.equal(resolveJobOwnerName({ userName: "johnny" }), "johnny");
  assert.equal(resolveJobOwnerName({ email: "john@example.com" }), "john");
  assert.equal(resolveJobOwnerName(null), null);
});
