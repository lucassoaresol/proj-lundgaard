import { Queue, Worker } from "bullmq";
import { createTask } from "../../models/task/create";
import { updateTask } from "../../models/task/update";
import { excludeTask } from "../../models/task/exclude";

export const createTaskQueue = new Queue<string>("create-task", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const createTaskWorker = new Worker<string>(
  "create-task",
  async (job) => {
    await createTask(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateTaskQueue = new Queue<string>("update-task", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const updateTaskWorker = new Worker<string>(
  "update-task",
  async (job) => {
    await updateTask(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const excludeTaskQueue = new Queue<string>("exclude-task", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const excludeTaskWorker = new Worker<string>(
  "exclude-task",
  async (job) => {
    await excludeTask(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);
