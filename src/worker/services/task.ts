import { Worker } from "bullmq";
import type { TaskAssigneeJob, TaskCustomerJob } from "../../queues";
import { createTask } from "../../models/task/create";
import { updateTask } from "../../models/task/update";
import { excludeTask } from "../../models/task/exclude";
import { updateTaskAssignee } from "../../models/task/updateAssignee";
import { updateTaskCustomer } from "../../models/task/updateCustomer";
import { runWithRetryPolicy } from "../retryPolicy";

export const createTaskWorker = new Worker<string>(
  "create-task",
  async (job) => {
    await runWithRetryPolicy(() => createTask(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateTaskWorker = new Worker<string>(
  "update-task",
  async (job) => {
    await runWithRetryPolicy(() => updateTask(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateTaskAssigneeWorker = new Worker<TaskAssigneeJob>(
  "update-task-assignee",
  async (job) => {
    await runWithRetryPolicy(() =>
      updateTaskAssignee(job.data.notion_id, job.data.assignee),
    );
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateTaskCustomerWorker = new Worker<TaskCustomerJob>(
  "update-task-customer",
  async (job) => {
    await runWithRetryPolicy(() =>
      updateTaskCustomer(
        job.data.notion_id,
        job.data.project,
        job.data.customer_id,
      ),
    );
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const excludeTaskWorker = new Worker<string>(
  "exclude-task",
  async (job) => {
    await runWithRetryPolicy(() => excludeTask(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);
