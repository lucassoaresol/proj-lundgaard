import { Queue, Worker } from "bullmq";
import { createCompletedTask } from "../../models/completedTask/create";
import { excludeCompletedTask } from "../../models/completedTask/exclude";
import { updateCompletedTask } from "../../models/completedTask/update";

export const createCompletedTaskQueue = new Queue<{ notion_id: string, data_source_id: number }>("create-completed-task", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const createCompletedTaskWorker = new Worker<{ notion_id: string, data_source_id: number }>(
  "create-completed-task",
  async (job) => {
    await createCompletedTask(job.data.notion_id, job.data.data_source_id)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateCompletedTaskQueue = new Queue<{ notion_id: string, data_source_id: number }>("update-completed-task", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const updateCompletedTaskWorker = new Worker<{ notion_id: string, data_source_id: number }>(
  "update-completed-task",
  async (job) => {
    await updateCompletedTask(job.data.notion_id, job.data.data_source_id)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const excludeCompletedTaskQueue = new Queue<string>("exclude-completed-task", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const excludeCompletedTaskWorker = new Worker<string>(
  "exclude-completed-task",
  async (job) => {
    await excludeCompletedTask(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);
