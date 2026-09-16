import assert from "node:assert/strict";
import test from "node:test";

import {
  insertTaskDevIdempotently,
  runCreateTaskDev,
} from "../../src/models/dev/createTaskIdempotency";

test("concurrent DEV task creation inserts once and treats the loser as success", async () => {
  let winner: { id: number } | null = null;
  let inserts = 0;

  const insert = async (): Promise<{ id: number }> => {
    await new Promise((resolve) => setImmediate(resolve));
    if (winner) {
      throw Object.assign(new Error("duplicate"), {
        code: "23505",
        constraint: "tasks_notion_id_key",
      });
    }
    winner = { id: 41 };
    inserts += 1;
    return winner;
  };
  const findWinner = async () => winner;

  const [first, second] = await Promise.all([
    insertTaskDevIdempotently(insert, findWinner),
    insertTaskDevIdempotently(insert, findWinner),
  ]);

  assert.equal(inserts, 1);
  assert.deepEqual([first, second].map(({ inserted }) => inserted).sort(), [
    false,
    true,
  ]);
  assert.deepEqual([first.id, second.id], [41, 41]);
});

test("the expected notion_id violation rereads the winning row", async () => {
  const result = await insertTaskDevIdempotently(
    async () => {
      throw Object.assign(new Error("duplicate"), {
        code: "23505",
        constraint: "tasks_notion_id_key",
      });
    },
    async () => ({ id: 9 }),
  );

  assert.deepEqual(result, { id: 9, inserted: false });
});

test("a violation from another constraint is preserved", async () => {
  const violation = Object.assign(new Error("duplicate"), {
    code: "23505",
    constraint: "tasks_other_unique_key",
  });

  await assert.rejects(
    insertTaskDevIdempotently(
      async () => {
        throw violation;
      },
      async () => ({ id: 1 }),
    ),
    (error: unknown) => error === violation,
  );
});

test("a redelivery resumes a row left partial after insert without repeating completed effects", async () => {
  let row: { id: number } | null = null;
  let insertions = 0;
  let notionUpdates = 0;
  let saves = 0;
  let failFirstSave = true;
  let page: any = {
    properties: {
      ID: { number: undefined },
      Editable: { checkbox: false },
      Project: { select: { name: "ACME" } },
      Cliente: { relation: [] as Array<{ id: string }> },
      Assignee: { select: { name: "ANA" } },
    },
    last_edited_time: "2026-09-16T10:00:00.000Z",
  };
  const mapPage = (value: any) => ({
    customer: value.properties.Project.select.name,
    customer_id: 7,
    assignee: value.properties.Assignee.select.name,
    people: "ANA",
    is_editable: value.properties.Editable.checkbox,
  });
  const dependencies = {
    findExisting: async () => row,
    retrievePage: async () => page,
    mapPage,
    resolveCustomer: async () => ({
      id: 7,
      name: "ACME",
      notion_id: "customer-page",
    }),
    insert: () => async () => {
      insertions += 1;
      row = { id: 41 };
      return row;
    },
    findWinner: async () => row,
    updatePage: async (properties: Record<string, any>) => {
      notionUpdates += 1;
      page = {
        properties: {
          ...page.properties,
          ...properties,
          ID: properties.ID as { number: undefined },
          Editable: properties.Editable as { checkbox: false },
          Cliente: properties.Cliente as { relation: Array<{ id: string }> },
        },
        last_edited_time: "2026-09-16T10:01:00.000Z",
      };
      return page;
    },
    saveRow: async () => {
      saves += 1;
      if (failFirstSave) {
        failFirstSave = false;
        throw new Error("database unavailable after Notion update");
      }
    },
  };

  await assert.rejects(runCreateTaskDev(dependencies));
  await runCreateTaskDev(dependencies);

  assert.equal(insertions, 1);
  assert.equal(notionUpdates, 1);
  assert.equal(saves, 2);
});

test("the concurrent insert loser does not duplicate post-insert side effects", async () => {
  let notionUpdates = 0;
  let saves = 0;

  await runCreateTaskDev({
    findExisting: async () => null,
    retrievePage: async () => ({
      properties: {},
      last_edited_time: "2026-09-16T10:00:00.000Z",
    }),
    mapPage: () => ({
      customer: "",
      customer_id: undefined,
      assignee: "",
      people: "",
      is_editable: false,
    }),
    resolveCustomer: async () => undefined,
    insert: () => async () => {
      throw Object.assign(new Error("duplicate"), {
        code: "23505",
        constraint: "tasks_notion_id_key",
      });
    },
    findWinner: async () => ({ id: 41 }),
    updatePage: async () => {
      notionUpdates += 1;
      throw new Error("must not update");
    },
    saveRow: async () => {
      saves += 1;
    },
  });

  assert.equal(notionUpdates, 0);
  assert.equal(saves, 0);
});
