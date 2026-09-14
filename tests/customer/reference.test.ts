import assert from "node:assert/strict";
import test from "node:test";

import { CustomerReference, resolveCustomerReference } from "../../src/models/customer/reference";

const valid: CustomerReference = { id: 7, name: "ACME", notion_id: "page-valid" };

test("uses a valid local customer without creating another customer", async () => {
  let creates = 0;
  const result = await resolveCustomerReference("ignored", 7, {
    findById: async () => valid,
    findByName: async () => undefined,
    createByName: async () => { creates += 1; return undefined; },
  });
  assert.equal(result, valid);
  assert.equal(creates, 0);
});

test("falls back from a stale id to the normalized project name", async () => {
  const result = await resolveCustomerReference("  acme  ", 999, {
    findById: async () => undefined,
    findByName: async (name) => name === "ACME" ? valid : undefined,
    createByName: async () => undefined,
  });
  assert.equal(result, valid);
});

test("creates through the canonical resolver when id and name are absent locally", async () => {
  let createdName = "";
  const result = await resolveCustomerReference(" new customer ", 999, {
    findById: async () => undefined,
    findByName: async () => undefined,
    createByName: async (name) => {
      createdName = name;
      return { id: 8, name, notion_id: "page-created" };
    },
  });
  assert.equal(createdName, "NEW CUSTOMER");
  assert.equal(result?.id, 8);
});

test("keeps customer null when a stale id has no resolvable project", async () => {
  let creates = 0;
  const result = await resolveCustomerReference("", 999, {
    findById: async () => undefined,
    findByName: async () => undefined,
    createByName: async () => { creates += 1; return undefined; },
  });
  assert.equal(result, undefined);
  assert.equal(creates, 0);
});
