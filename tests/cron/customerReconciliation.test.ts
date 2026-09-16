import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { reconcileTaskCustomers } from "../../src/cron/reconcileTaskCustomers";
import {
  CUSTOMER_PROBE_BATCH_LIMIT,
  CUSTOMER_QUEUE_BATCH_LIMIT,
  selectCustomerReconciliationBatch,
} from "../../src/models/task/customerReconciliation";

const now = new Date("2026-09-16T00:30:00.000Z");

function task(id: number, data: unknown) {
  return { id, notion_id: `notion-${id}`, data };
}

test("a task without a usable customer reference is probed, not immediately enqueued", () => {
  const selection = selectCustomerReconciliationBatch(
    [
      task(1, {
        customer: "  ",
        customer_id: undefined,
      }),
    ],
    now,
  );

  assert.equal(selection.direct.length, 0);
  assert.deepEqual(
    selection.probes.map(({ id }) => id),
    [1],
  );
});

test("a task with a stored customer name is enqueued without a Notion probe", () => {
  const selection = selectCustomerReconciliationBatch(
    [
      task(1, {
        customer: " ACME ",
      }),
    ],
    now,
  );

  assert.deepEqual(
    selection.direct.map(({ id }) => id),
    [1],
  );
  assert.equal(selection.probes.length, 0);
});

test("reconciliation limits queue work and Notion probes independently", () => {
  const valid = Array.from({ length: 150 }, (_, index) =>
    task(index + 1, {
      customer_id: index + 1,
    }),
  );
  const missing = Array.from({ length: 50 }, (_, index) =>
    task(index + 151, {}),
  );
  const selection = selectCustomerReconciliationBatch(
    [...valid, ...missing],
    now,
  );

  assert.equal(selection.direct.length, CUSTOMER_QUEUE_BATCH_LIMIT);
  assert.equal(selection.probes.length, CUSTOMER_PROBE_BATCH_LIMIT);
});

test("reconciliation executes no more than the queue and Notion call limits", async () => {
  const valid = Array.from({ length: 150 }, (_, index) =>
    task(index + 1, { customer_id: index + 1 }),
  );
  const missing = Array.from({ length: 50 }, (_, index) =>
    task(index + 151, {}),
  );
  let enqueues = 0;
  let notionCalls = 0;

  await reconcileTaskCustomers(
    {
      listTasks: async () => [...valid, ...missing],
      enqueue: async () => {
        enqueues += 1;
      },
      retrievePage: async () => {
        notionCalls += 1;
        return { properties: {} };
      },
      mapPage: () => ({ customer: "", customer_id: undefined }),
      saveTaskData: async () => undefined,
      classifyError: () => ({ errorClass: "UNKNOWN", retryable: true }),
    },
    now,
  );

  assert.equal(enqueues, CUSTOMER_QUEUE_BATCH_LIMIT);
  assert.equal(notionCalls, CUSTOMER_PROBE_BATCH_LIMIT);
});

test("Notion object_not_found quarantines the local row without deleting it", async () => {
  const saved: Array<{ id: number; data: any }> = [];
  const logs: Array<Record<string, unknown>> = [];
  let enqueues = 0;

  const result = await reconcileTaskCustomers(
    {
      listTasks: async () => [task(7, {})],
      enqueue: async () => {
        enqueues += 1;
      },
      retrievePage: async () => {
        throw Object.assign(new Error("not found"), {
          code: "object_not_found",
        });
      },
      mapPage: () => ({}),
      saveTaskData: async (id, data) => {
        saved.push({ id, data });
      },
      classifyError: () => ({
        errorClass: "NOTION_OBJECT_NOT_FOUND",
        retryable: false,
      }),
      logError: (_event, context) => {
        logs.push(context);
      },
    },
    now,
  );

  assert.equal(enqueues, 0);
  assert.deepEqual(result, { enqueued: 0, probed: 1, quarantined: 1 });
  assert.equal(saved[0].id, 7);
  assert.equal(
    saved[0].data._customer_reconciliation.status,
    "notion_inaccessible",
  );
  assert.equal(
    saved[0].data._customer_reconciliation.next_retry_at,
    "2026-10-16T00:30:00.000Z",
  );
  assert.equal(logs[0].errorClass, "NOTION_OBJECT_NOT_FOUND");
  assert.equal("notionId" in logs[0], false);
});

test("a confirmed page without a customer is cooled down as a legitimate no-customer task", async () => {
  const saved: any[] = [];
  let enqueues = 0;

  await reconcileTaskCustomers(
    {
      listTasks: async () => [task(8, {})],
      enqueue: async () => {
        enqueues += 1;
      },
      retrievePage: async () => ({ properties: {} }),
      mapPage: () => ({ customer: "", customer_id: undefined }),
      saveTaskData: async (_id, data) => {
        saved.push(data);
      },
      classifyError: () => ({ errorClass: "UNKNOWN", retryable: true }),
    },
    now,
  );

  assert.equal(enqueues, 0);
  assert.equal(
    saved[0]._customer_reconciliation.status,
    "no_customer_reference",
  );
  const nextDay = new Date("2026-09-17T00:30:00.000Z");
  const selection = selectCustomerReconciliationBatch(
    [task(8, saved[0])],
    nextDay,
  );
  assert.equal(selection.direct.length, 0);
  assert.equal(selection.probes.length, 0);
});

test("a transient Notion failure gets a short cooldown without quarantine", async () => {
  const saved: any[] = [];
  const candidate = task(9, {});

  await reconcileTaskCustomers(
    {
      listTasks: async () => [candidate],
      enqueue: async () => undefined,
      retrievePage: async () => {
        throw Object.assign(new Error("timeout"), { code: "ETIMEDOUT" });
      },
      mapPage: () => ({}),
      saveTaskData: async (_id, data) => {
        saved.push(data);
      },
      classifyError: () => ({
        errorClass: "NETWORK_TRANSIENT",
        retryable: true,
      }),
      logError: () => undefined,
    },
    now,
  );

  assert.equal(saved[0]._customer_reconciliation.status, "transient_failure");
  assert.equal(
    saved[0]._customer_reconciliation.next_retry_at,
    "2026-09-17T00:30:00.000Z",
  );
});

test("never-probed tasks are selected before expired markers", () => {
  const oldMarker = {
    _customer_reconciliation: {
      status: "no_customer_reference",
      next_retry_at: "2026-09-01T00:00:00.000Z",
    },
  };
  const previouslyProbed = Array.from(
    { length: CUSTOMER_PROBE_BATCH_LIMIT },
    (_, index) => task(index + 1, oldMarker),
  );
  const neverProbed = task(99, {});

  const selection = selectCustomerReconciliationBatch(
    [...previouslyProbed, neverProbed],
    now,
  );

  assert.equal(selection.probes[0].id, neverProbed.id);
});

test("the cron source contains no obsolete filesystem cleanup", async () => {
  const source = await readFile(
    new URL("../../src/cron/index.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /runShellScript|\bfind\s|["']logs["']|["']public["']/,
  );
});
