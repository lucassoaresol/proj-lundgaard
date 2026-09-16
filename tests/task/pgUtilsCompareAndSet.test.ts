import assert from "node:assert/strict";
import test from "node:test";

import { Database } from "pg-utils";

import { compareAndSetTaskData } from "../../src/models/task/customerReconciliation";

type CapturedQuery = { sql: string; values: unknown[] };

function databaseWithCapturedQuery(captured: CapturedQuery) {
  const database = new Database("user", "host", "password", 5432, "database");
  (database as unknown as { pool: unknown }).pool = {
    query: async (sql: string, values: unknown[]) => {
      captured.sql = sql.replace(/\s+/g, " ").trim();
      captured.values = values;
      return { rows: [] };
    },
  };
  return database;
}

test("pg-utils 1.0.6 builds whole-JSON equality from a value condition", async () => {
  const captured: CapturedQuery = { sql: "", values: [] };
  const database = databaseWithCapturedQuery(captured);
  const oldData = { customer: "A", nested: { value: 1 } };
  const newData = { ...oldData, status: "updated" };

  await database.updateIntoTable({
    table: "tasks",
    ...compareAndSetTaskData(7, oldData, newData),
  });

  assert.equal(
    captured.sql,
    'UPDATE tasks SET "data" = $1 WHERE (id = $2 AND data = $3);',
  );
  assert.deepEqual(captured.values, [newData, 7, oldData]);
});

test("pg-utils 1.0.6 builds IS NULL for an undefined database snapshot", async () => {
  const captured: CapturedQuery = { sql: "", values: [] };
  const database = databaseWithCapturedQuery(captured);
  const newData = { status: "updated" };

  await database.updateIntoTable({
    table: "tasks",
    ...compareAndSetTaskData(7, undefined, newData),
  });

  assert.equal(
    captured.sql,
    'UPDATE tasks SET "data" = $1 WHERE (id = $2 AND data IS NULL);',
  );
  assert.deepEqual(captured.values, [newData, 7]);
});
