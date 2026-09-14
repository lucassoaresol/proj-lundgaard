import { Worker } from "bullmq";
import type { CompletedTaskJob } from "../../queues";
import { createCompletedTask } from "../../models/completedTask/create";
import { excludeCompletedTask } from "../../models/completedTask/exclude";
import { updateCompletedTask } from "../../models/completedTask/update";
import { runWithRetryPolicy } from "../retryPolicy";

export const createCompletedTaskWorker = new Worker<CompletedTaskJob>(
  "create-completed-task",
  async (job) => {
    await runWithRetryPolicy(() =>
      createCompletedTask(job.data.notion_id, job.data.data_source_id),
    );
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateCompletedTaskWorker = new Worker<CompletedTaskJob>(
  "update-completed-task",
  async (job) => {
    await runWithRetryPolicy(() =>
      updateCompletedTask(job.data.notion_id, job.data.data_source_id),
    );
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const excludeCompletedTaskWorker = new Worker<string>(
  "exclude-completed-task",
  async (job) => {
    await runWithRetryPolicy(() => excludeCompletedTask(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);
