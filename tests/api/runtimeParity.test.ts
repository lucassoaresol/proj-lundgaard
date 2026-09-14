import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { FastifyInstance } from "fastify";

import { createApp, NotionWebhookBody } from "../../src/api/createApp";

const templatePath = new URL("../../views/export-csv.html", import.meta.url);

function fixtureApp() {
  const events: string[] = [];
  const app = createApp({
    queueDashboardPlugin: async (instance: FastifyInstance) => { instance.get("/", async () => "queues"); },
    receivedNotionCommentWebhook: async (body) => { events.push(body.type); },
    receivedNotionPageWebhook: async (body) => { events.push(body.type); },
    readExportTemplate: () => readFile(templatePath, "utf8"),
    findCustomers: async () => [{ id: 7, name: "CLIENTE TESTE" }],
    findTaskData: async () => [{ tarefa: "exemplo", horas: 2 }],
  });
  return { app, events };
}

test("production HTTP routes preserve the sanitized runtime contract", async () => {
  const { app, events } = fixtureApp();
  const root = await app.inject({ method: "GET", url: "/" });
  assert.equal(root.statusCode, 404);

  const customers = await app.inject({ method: "GET", url: "/api/customers" });
  assert.equal(customers.statusCode, 200);
  assert.match(customers.headers["content-type"] ?? "", /^application\/json/);
  assert.deepEqual(customers.json(), [{ id: 7, name: "CLIENTE TESTE" }]);

  const form = await app.inject({ method: "GET", url: "/export-csv" });
  assert.equal(form.statusCode, 200);
  assert.equal(form.headers["content-type"], "text/html; charset=utf-8");
  assert.equal(createHash("sha256").update(form.body).digest("hex"), "4c9e8e40e0ff71ea5b89d068144d42bd67a6502c208f3472fdd3d8210ac77a33");

  const csv = await app.inject({ method: "POST", url: "/export-csv", payload: { customerId: 7 } });
  assert.equal(csv.statusCode, 200);
  assert.equal(csv.headers["content-type"], "text/csv; charset=utf-8");
  assert.match(csv.headers["content-disposition"] ?? "", /customer-7\.csv/);

  const notionBody: NotionWebhookBody = { entity: { id: "test" }, type: "page.created", data: { parent: { data_source_id: "test" } } };
  const notion = await app.inject({ method: "POST", url: "/notion", payload: notionBody });
  assert.equal(notion.statusCode, 200);
  assert.deepEqual(events, ["page.created"]);

  const dashboard = await app.inject({ method: "GET", url: "/admin/queues/" });
  assert.equal(dashboard.statusCode, 200);
  await app.close();
});
