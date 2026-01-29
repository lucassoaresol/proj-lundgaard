import { Queue, Worker } from "bullmq";
import { createTask } from "../../models/task/create";
import { updateTask } from "../../models/task/update";
import { excludeTask } from "../../models/task/exclude";
import { updateTaskAssignee } from "../../models/task/updateAssignee";
import { updateTaskCustomer } from "../../models/task/updateCustomer";

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

export const updateTaskAssigneeQueue = new Queue<{ notion_id: string, assignee: string }>("update-task-assignee", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const updateTaskAssigneeWorker = new Worker<{ notion_id: string, assignee: string }>(
  "update-task-assignee",
  async (job) => {
    await updateTaskAssignee(job.data.notion_id, job.data.assignee)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateTaskCustomerQueue = new Queue<{ notion_id: string, project: string, customer_id: any }>("update-task-customer", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const updateTaskCustomerWorker = new Worker<{ notion_id: string, project: string, customer_id: any }>(
  "update-task-customer",
  async (job) => {
    await updateTaskCustomer(job.data.notion_id, job.data.project, job.data.customer_id)
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
