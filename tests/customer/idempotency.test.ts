import assert from "node:assert/strict";
import test from "node:test";

import { customerIdProperty } from "../../src/models/customer/idempotency";
import { insertCustomerIdempotently } from "../../src/models/customer/idempotency";

test("production customer ID payload uses only the numeric schema", () => {
  assert.deepEqual(customerIdProperty(42), { number: 42 });
});

test("customer creation race returns the existing winner", async () => {
  let winnerReads = 0;
  const result = await insertCustomerIdempotently(
    async () => {
      throw Object.assign(new Error("duplicate"), { code: "23505" });
    },
    async () => {
      winnerReads += 1;
      return { id: 42 };
    },
  );
  assert.deepEqual(result, { id: 42, inserted: false });
  assert.equal(winnerReads, 1);
});

test("customer creation preserves unknown database errors", async () => {
  await assert.rejects(
    () =>
      insertCustomerIdempotently(
        async () => {
          throw new Error("database down");
        },
        async () => null,
      ),
    /database down/,
  );
});
