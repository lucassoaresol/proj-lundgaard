import { Queue } from "bullmq";

const options = { connection: {}, prefix: "notion-lundgaard" } as const;

export type CompletedTaskJob = { notion_id: string; data_source_id: number };
export type TaskAssigneeJob = { notion_id: string; assignee: string };
export type TaskCustomerJob = {
  notion_id: string;
  project: string;
  customer_id: unknown;
};

export const createCustomerQueue = new Queue<string>("create-customer", options);
export const updateCustomerQueue = new Queue<string>("update-customer", options);
export const excludeCustomerQueue = new Queue<string>("exclude-customer", options);

export const createTaskQueue = new Queue<string>("create-task", options);
export const updateTaskQueue = new Queue<string>("update-task", options);
export const updateTaskAssigneeQueue = new Queue<TaskAssigneeJob>("update-task-assignee", options);
export const updateTaskCustomerQueue = new Queue<TaskCustomerJob>("update-task-customer", options);
export const excludeTaskQueue = new Queue<string>("exclude-task", options);

export const createTaskCommentQueue = new Queue<string>("create-task-comment", options);
export const updateTaskCommentQueue = new Queue<string>("update-task-comment", options);
export const excludeTaskCommentQueue = new Queue<string>("exclude-task-comment", options);

export const createYearQueue = new Queue<string>("create-year", options);
export const updateYearQueue = new Queue<string>("update-year", options);
export const excludeYearQueue = new Queue<string>("exclude-year", options);

export const createCompletedTaskQueue = new Queue<CompletedTaskJob>("create-completed-task", options);
export const updateCompletedTaskQueue = new Queue<CompletedTaskJob>("update-completed-task", options);
export const excludeCompletedTaskQueue = new Queue<string>("exclude-completed-task", options);
