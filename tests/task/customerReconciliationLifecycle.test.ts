import assert from "node:assert/strict";
import test from "node:test";

import {
  compareAndSetCustomerReconciliationMarker,
  CUSTOMER_RECONCILIATION_KEY,
  mergeCustomerReconciliationState,
  shouldQueueCustomerReconciliation,
} from "../../src/models/task/customerReconciliation";

const marker = {
  status: "no_customer_reference" as const,
  next_retry_at: "2026-10-16T00:30:00.000Z",
};
const now = new Date("2026-09-16T12:00:00.000Z");

test("an unrelated webhook update preserves customer reconciliation cooldown", () => {
  const previous = {
    customer: "ACME",
    customer_id: 7,
    status: "open",
    [CUSTOMER_RECONCILIATION_KEY]: marker,
  };
  const mappedWebhook = {
    customer: " acme ",
    customer_id: 7,
    status: "completed",
    notes: "changed",
  };

  const merged = mergeCustomerReconciliationState(previous, mappedWebhook);

  assert.equal(merged[CUSTOMER_RECONCILIATION_KEY], marker);
  assert.equal(merged.status, "completed");
  assert.equal(
    shouldQueueCustomerReconciliation(previous, mappedWebhook, now),
    false,
  );
});

test("a changed customer reference clears cooldown and reconciles immediately", () => {
  const previous = {
    customer: "ACME",
    customer_id: 7,
    [CUSTOMER_RECONCILIATION_KEY]: marker,
  };
  const mappedWebhook = { customer: "BETA", customer_id: 9 };

  const merged = mergeCustomerReconciliationState(previous, mappedWebhook);

  assert.equal(merged[CUSTOMER_RECONCILIATION_KEY], undefined);
  assert.equal(
    shouldQueueCustomerReconciliation(previous, mappedWebhook, now),
    true,
  );
});

test("marker compare-and-set rejects a stale task data snapshot", () => {
  const oldData = { status: "open" };
  const currentData = { status: "open", customer: "ACME", customer_id: 7 };
  const update = compareAndSetCustomerReconciliationMarker(
    12,
    oldData,
    "transient_failure",
    now,
    1,
  );

  assert.deepEqual(update.where, { id: 12, data: { value: oldData } });
  assert.notDeepEqual(currentData, update.where.data?.value);
  assert.equal(
    shouldQueueCustomerReconciliation(oldData, currentData, now),
    true,
  );
});

test("a null database snapshot uses IS NULL semantics", () => {
  const fromNull = compareAndSetCustomerReconciliationMarker(
    12,
    null,
    "transient_failure",
    now,
  );
  const fromUndefined = compareAndSetCustomerReconciliationMarker(
    12,
    undefined,
    "transient_failure",
    now,
  );

  assert.equal(fromNull.where.data, null);
  assert.equal(fromUndefined.where.data, null);
});
