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

export const createCustomerDevQueue = new Queue<string>("create-customer-dev", options);
export const updateCustomerDevQueue = new Queue<string>("update-customer-dev", options);
export const excludeCustomerDevQueue = new Queue<string>("exclude-customer-dev", options);

export const createTaskDevQueue = new Queue<string>("create-task-dev", options);
export const updateTaskDevQueue = new Queue<string>("update-task-dev", options);
export const excludeTaskDevQueue = new Queue<string>("exclude-task-dev", options);

export const createTaskCommentDevQueue = new Queue<string>("create-task-comment-dev", options);
export const updateTaskCommentDevQueue = new Queue<string>("update-task-comment-dev", options);
export const excludeTaskCommentDevQueue = new Queue<string>("exclude-task-comment-dev", options);

export const createYearDevQueue = new Queue<string>("create-year-dev", options);
export const updateYearDevQueue = new Queue<string>("update-year-dev", options);
export const excludeYearDevQueue = new Queue<string>("exclude-year-dev", options);

export const createCompletedTaskDevQueue = new Queue<CompletedTaskJob>("create-completed-task-dev", options);
export const updateCompletedTaskDevQueue = new Queue<CompletedTaskJob>("update-completed-task-dev", options);
export const excludeCompletedTaskDevQueue = new Queue<string>("exclude-completed-task-dev", options);
