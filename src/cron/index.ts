import { CronJob } from "cron";

import databaseNotionPromise from "../db/notion";
import notion from "../libs/notion";
import { mapRecordTask } from "../models/task/mapRecord";
import { updateTaskCustomerQueue } from "../queues";
import {
  classifyJobError,
  CONTROLLED_RETRY_OPTIONS,
} from "../worker/retryPolicy";

import { reconcileTaskCustomers } from "./reconcileTaskCustomers";

CronJob.from({
  cronTime: "30 0 * * *",
  onTick: async () => {
    const database = await databaseNotionPromise;

    await reconcileTaskCustomers({
      listTasks: () =>
        database.findMany({
          table: "tasks",
          where: { customer_id: null },
          select: { id: true, notion_id: true, data: true },
          orderBy: { id: "ASC" },
        }),
      enqueue: (data) =>
        updateTaskCustomerQueue.add(
          "save-update-task-customer",
          data,
          CONTROLLED_RETRY_OPTIONS,
        ),
      retrievePage: (notionId) => notion.pages.retrieve({ page_id: notionId }),
      mapPage: (page) => mapRecordTask((page as any).properties),
      saveTaskData: ({ dataDict, where }) =>
        database.updateIntoTable({
          table: "tasks",
          dataDict,
          where,
        }),
      classifyError: classifyJobError,
    });
  },
  start: true,
});
