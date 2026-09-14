import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import databaseNotionPromise from "../db/notion";

import { createApp } from "./createApp";
import { serverAdapter } from "./bull";
import { receivedNotionCommentWebhook } from "./modules/comment";
import { receivedNotionCommentDevWebhook } from "./modules/dev/comment";
import { receivedNotionPageDevWebhook } from "./modules/dev/page";
import { receivedNotionPageWebhook } from "./modules/page";

const app = createApp({
  queueDashboardPlugin: serverAdapter.registerPlugin(),
  receivedNotionCommentWebhook: async (body) => {
    await Promise.all([receivedNotionCommentWebhook(body), receivedNotionCommentDevWebhook(body)]);
  },
  receivedNotionPageWebhook: async (body) => {
    await Promise.all([receivedNotionPageWebhook(body), receivedNotionPageDevWebhook(body)]);
  },
  readExportTemplate: () => readFile(resolve(process.cwd(), "views", "export-csv.html"), "utf8"),
  findCustomers: async () => {
    const database = await databaseNotionPromise;
    return database.findMany<{ id: number; name: string }>({
      table: "customers", select: { id: true, name: true }, orderBy: { name: "ASC" },
    });
  },
  findTaskData: async (customerId) => {
    const database = await databaseNotionPromise;
    const tasks = await database.findMany<{ data: Record<string, unknown> | null }>({
      table: "tasks", where: { customer_id: customerId }, select: { data: true },
    });
    return tasks.map((task) => task.data ?? {});
  },
});

export default app;
