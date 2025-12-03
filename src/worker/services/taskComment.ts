import { Queue, Worker } from "bullmq";
import { createTaskComment } from "../../models/taskComment/create";
import { updateTaskComment } from "../../models/taskComment/update";
import { excludeTaskComment } from "../../models/taskComment/exclude";


export const createTaskCommentQueue = new Queue<string>("create-task-comment", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const createTaskCommentWorker = new Worker<string>(
  "create-task-comment",
  async (job) => {
    await createTaskComment(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateTaskCommentQueue = new Queue<string>("update-task-comment", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const updateTaskCommentWorker = new Worker<string>(
  "update-task-comment",
  async (job) => {
    await updateTaskComment(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const excludeTaskCommentQueue = new Queue<string>("exclude-task-comment", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const excludeTaskCommentWorker = new Worker<string>(
  "exclude-task-comment",
  async (job) => {
    await excludeTaskComment(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);
