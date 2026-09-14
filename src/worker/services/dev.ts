import { Worker } from "bullmq";

import {
  createCompletedTaskDev, excludeCompletedTaskDev, updateCompletedTaskDev,
} from "../../models/dev/completedTask";
import { createCustomerDev, excludeCustomerDev, updateCustomerDev } from "../../models/dev/customer";
import { createTaskDev, excludeTaskDev, updateTaskDev } from "../../models/dev/task";
import { createTaskCommentDev, excludeTaskCommentDev, updateTaskCommentDev } from "../../models/dev/taskComment";
import { createYearDev, excludeYearDev, updateYearDev } from "../../models/dev/year";
import type { CompletedTaskJob } from "../../queues";
import { runWithRetryPolicy } from "../retryPolicy";

const options = {
  connection: {}, removeOnComplete: { count: 1000 }, removeOnFail: { count: 5000 }, prefix: "notion-lundgaard",
} as const;

function stringWorker(name: string, operation: (notionId: string) => Promise<unknown>) {
  return new Worker<string>(name, (job) => runWithRetryPolicy(() => operation(job.data)), options);
}

function completedTaskWorker(name: string, operation: (notionId: string, dataSourceId: number) => Promise<unknown>) {
  return new Worker<CompletedTaskJob>(name, (job) => runWithRetryPolicy(() => operation(job.data.notion_id, job.data.data_source_id)), options);
}

export const createCustomerDevWorker = stringWorker("create-customer-dev", createCustomerDev);
export const updateCustomerDevWorker = stringWorker("update-customer-dev", updateCustomerDev);
export const excludeCustomerDevWorker = stringWorker("exclude-customer-dev", excludeCustomerDev);
export const createTaskDevWorker = stringWorker("create-task-dev", createTaskDev);
export const updateTaskDevWorker = stringWorker("update-task-dev", updateTaskDev);
export const excludeTaskDevWorker = stringWorker("exclude-task-dev", excludeTaskDev);
export const createTaskCommentDevWorker = stringWorker("create-task-comment-dev", createTaskCommentDev);
export const updateTaskCommentDevWorker = stringWorker("update-task-comment-dev", updateTaskCommentDev);
export const excludeTaskCommentDevWorker = stringWorker("exclude-task-comment-dev", excludeTaskCommentDev);
export const createYearDevWorker = stringWorker("create-year-dev", createYearDev);
export const updateYearDevWorker = stringWorker("update-year-dev", updateYearDev);
export const excludeYearDevWorker = stringWorker("exclude-year-dev", excludeYearDev);
export const createCompletedTaskDevWorker = completedTaskWorker("create-completed-task-dev", createCompletedTaskDev);
export const updateCompletedTaskDevWorker = completedTaskWorker("update-completed-task-dev", updateCompletedTaskDev);
export const excludeCompletedTaskDevWorker = stringWorker("exclude-completed-task-dev", excludeCompletedTaskDev);
