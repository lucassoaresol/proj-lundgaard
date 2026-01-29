import { CronJob } from "cron";

import databaseNotionPromise from "../db/notion";
import notion from "../libs/notion";
import { mapRecordTask } from "../models/task/mapRecord";
import { runShellScript } from "../utils/runShellScript";
import { updateTaskCustomerQueue } from "../worker/services/task";

CronJob.from({
  cronTime: "0 0 * * *",
  onTick: () => {
    const dirs = ["logs"];
    dirs.forEach((el) =>
      runShellScript(`find ${el} -type f -mtime +5 -exec rm {} \\;`),
    );
  },
  start: true,
});

CronJob.from({
  cronTime: "30 0 * * *",
  onTick: async () => {
    const database = await databaseNotionPromise;

    const tasks = await database.findMany<{
      id: number;
      data: any;
      notion_id: string;
    }>({
      table: "tasks",
      where: { customer_id: null },
      select: { id: true, data: true, notion_id: true },
    });

    for (const task of tasks) {
      const result = (await notion.pages.retrieve({
        page_id: task.notion_id,
      })) as any;
      const data = mapRecordTask(result.properties);

      await updateTaskCustomerQueue.add(
        "save-update-task-customer",
        {
          notion_id: task.notion_id,
          project: data.customer,
          customer_id: data.customer_id,
        },
        {
          attempts: 1000,
          backoff: { type: "exponential", delay: 5000 },
        },
      );
    }
  },
  start: true,
});
