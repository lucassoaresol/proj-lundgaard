import assert from "node:assert/strict";
import test from "node:test";

import { reconcileTaskCustomers } from "../../src/cron/reconcileTaskCustomers";
import { resolveCurrentCustomerJob } from "../../src/models/task/customerJobGuard";
import { selectCustomerReconciliationBatch } from "../../src/models/task/customerReconciliation";

const now = new Date("2026-09-16T00:30:00.000Z");

test("a probe job becomes stale when its CAS loses to a newer customer reference", async () => {
  const oldData = { status: "open" };
  const customerA = { status: "open", customer: "A CLIENT", customer_id: 1 };
  const customerB = { status: "open", customer: "B CLIENT", customer_id: 2 };
  let persistedData: unknown = oldData;
  let enqueuedJob:
    | { notion_id: string; project: string; customer_id: number | undefined }
    | undefined;

  await reconcileTaskCustomers(
    {
      listTasks: async () => [{ id: 7, notion_id: "task", data: oldData }],
      retrievePage: async () => ({ properties: {} }),
      mapPage: () => {
        persistedData = customerB;
        return customerA;
      },
      saveTaskData: async ({ dataDict, where }) => {
        const expectedData = where.data?.value;
        if (JSON.stringify(persistedData) === JSON.stringify(expectedData)) {
          persistedData = dataDict.data;
        }
      },
      enqueue: async (job) => {
        enqueuedJob = job;
      },
      classifyError: () => ({ errorClass: "UNKNOWN", retryable: true }),
    },
    now,
  );

  assert.deepEqual(enqueuedJob, {
    notion_id: "task",
    project: "A CLIENT",
    customer_id: 1,
  });
  assert.deepEqual(persistedData, customerB);

  let resolutions = 0;
  let notionUpdates = 0;
  const current = await resolveCurrentCustomerJob({
    project: enqueuedJob.project,
    customerId: enqueuedJob.customer_id,
    loadTask: async () => ({ id: 7, customer_id: null, data: persistedData }),
    resolveCustomer: async () => {
      resolutions += 1;
      return { id: 1, name: "A CLIENT", notion_id: "notion-a" };
    },
    onStale: () => undefined,
  });

  if (current) notionUpdates += 1;

  assert.equal(current, undefined);
  assert.equal(resolutions, 0);
  assert.equal(notionUpdates, 0);
  assert.deepEqual(persistedData, customerB);
  assert.deepEqual(
    selectCustomerReconciliationBatch(
      [{ id: 7, notion_id: "task", data: persistedData }],
      now,
    ).direct.map(({ id }) => id),
    [7],
  );
});

test("a job for customer A becomes stale when customer B is persisted during resolution", async () => {
  const customerA = { customer: "A CLIENT", customer_id: 1 };
  const customerB = { customer: "B CLIENT", customer_id: 2 };
  let persistedData = customerA;
  let notionUpdates = 0;
  let staleLogs = 0;

  const current = await resolveCurrentCustomerJob({
    project: customerA.customer,
    customerId: customerA.customer_id,
    loadTask: async () => ({ id: 7, customer_id: null, data: persistedData }),
    resolveCustomer: async () => {
      persistedData = customerB;
      return { id: 1, name: "A CLIENT", notion_id: "notion-a" };
    },
    onStale: () => {
      staleLogs += 1;
    },
  });

  if (current) notionUpdates += 1;

  assert.equal(current, undefined);
  assert.equal(notionUpdates, 0);
  assert.equal(staleLogs, 1);
  assert.deepEqual(persistedData, customerB);
  assert.deepEqual(
    selectCustomerReconciliationBatch(
      [{ id: 7, notion_id: "task", data: persistedData }],
      now,
    ).direct.map(({ id }) => id),
    [7],
  );
});

test("an already stale job skips customer resolution", async () => {
  let resolutions = 0;

  const current = await resolveCurrentCustomerJob({
    project: "A CLIENT",
    customerId: 1,
    loadTask: async () => ({
      id: 7,
      customer_id: null,
      data: { customer: "B CLIENT", customer_id: 2 },
    }),
    resolveCustomer: async () => {
      resolutions += 1;
      return undefined;
    },
    onStale: () => undefined,
  });

  assert.equal(current, undefined);
  assert.equal(resolutions, 0);
});
