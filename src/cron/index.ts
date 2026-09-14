import { CronJob } from "cron";
import { createHash } from "node:crypto";

import databaseNotionPromise from "../db/notion";
import notion from "../libs/notion";
import { mapRecordTask } from "../models/task/mapRecord";
import { runShellScript } from "../utils/runShellScript";
import { updateTaskCustomerQueue } from "../queues";
import { classifyJobError, CONTROLLED_RETRY_OPTIONS } from "../worker/retryPolicy";

function taskRef(notionId: string): string {
  return createHash("sha256").update(notionId).digest("hex").slice(0, 10);
}

CronJob.from({
  cronTime: "0 0 * * *",
  onTick: () => {
    const dirs = ["logs", "public"];
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
      notion_id: string;
    }>({
      table: "tasks",
      where: { customer_id: null },
      select: { notion_id: true },
    });

    for (const task of tasks) {
      try {
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
          CONTROLLED_RETRY_OPTIONS,
        );
      } catch (error) {
        const classification = classifyJobError(error);
        console.error("cron_task_customer_failed", {
          queue: "update-task-customer",
          job: "save-update-task-customer",
          taskRef: taskRef(task.notion_id),
          errorClass: classification.errorClass,
          retryable: classification.retryable,
        });

        if (classification.retryable) throw error;
      }
    }
  },
  start: true,
});
