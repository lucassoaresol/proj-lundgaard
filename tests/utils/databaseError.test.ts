import assert from "node:assert/strict";
import test from "node:test";

import { isUniqueViolation } from "../../src/utils/databaseError";
import { classifyJobError } from "../../src/worker/retryPolicy";

test("treats a duplicate event SQLSTATE as an idempotency conflict", () => {
  assert.equal(isUniqueViolation({ code: "23505" }), true);
  assert.deepEqual(classifyJobError({ code: "23505" }), {
    errorClass: "POSTGRES_UNIQUE_VIOLATION",
    retryable: false,
  });
});

test("classifies a foreign-key violation as permanent", () => {
  assert.deepEqual(classifyJobError({ code: "23503" }), {
    errorClass: "POSTGRES_FOREIGN_KEY_VIOLATION",
    retryable: false,
  });
});
