import assert from "node:assert/strict";
import test from "node:test";

import { mapRecordCustomer } from "../../src/models/customer/mapRecord";
import { mapRecordTask } from "../../src/models/task/mapRecord";

test("task mapper preserves the authoritative customer relation", () => {
  const data = mapRecordTask({
    Cliente: { relation: [{ id: "customer-page" }] },
    Project: { multi_select: [{ name: "A" }, { name: "B" }] },
  } as any);
  assert.equal(data.customer_notion_id, "customer-page");
  assert.equal(data.customer, "");
});

test("task mapper accepts legacy select project values", () => {
  assert.equal(
    mapRecordTask({ Project: { select: { name: "A" } } } as any).customer,
    "A",
  );
});

test("customer mapper preserves a positive numeric ID", () => {
  assert.deepEqual(
    mapRecordCustomer({
      Nome: { title: [{ text: { content: "Acme" } }] },
      ID: { number: 42 },
    } as any),
    { name: "ACME", tasks: [], id: 42 },
  );
});
