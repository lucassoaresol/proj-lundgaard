import { Worker } from "bullmq";
import { createTaskComment } from "../../models/taskComment/create";
import { updateTaskComment } from "../../models/taskComment/update";
import { excludeTaskComment } from "../../models/taskComment/exclude";
import { runWithRetryPolicy } from "../retryPolicy";


export const createTaskCommentWorker = new Worker<string>(
  "create-task-comment",
  async (job) => {
    await runWithRetryPolicy(() => createTaskComment(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateTaskCommentWorker = new Worker<string>(
  "update-task-comment",
  async (job) => {
    await runWithRetryPolicy(() => updateTaskComment(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const excludeTaskCommentWorker = new Worker<string>(
  "exclude-task-comment",
  async (job) => {
    await runWithRetryPolicy(() => excludeTaskComment(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);
