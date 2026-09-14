import { observeWorker } from "./observeWorker";
import {
  createCompletedTaskDevWorker, updateCompletedTaskDevWorker, excludeCompletedTaskDevWorker,
  createCustomerDevWorker, updateCustomerDevWorker, excludeCustomerDevWorker,
  createTaskDevWorker, updateTaskDevWorker, excludeTaskDevWorker,
  createTaskCommentDevWorker, updateTaskCommentDevWorker, excludeTaskCommentDevWorker,
  createYearDevWorker, updateYearDevWorker, excludeYearDevWorker,
} from "./services/dev";

const workers = [
  [createCustomerDevWorker, "create-customer-dev"], [updateCustomerDevWorker, "update-customer-dev"], [excludeCustomerDevWorker, "exclude-customer-dev"],
  [createTaskDevWorker, "create-task-dev"], [updateTaskDevWorker, "update-task-dev"], [excludeTaskDevWorker, "exclude-task-dev"],
  [createTaskCommentDevWorker, "create-task-comment-dev"], [updateTaskCommentDevWorker, "update-task-comment-dev"], [excludeTaskCommentDevWorker, "exclude-task-comment-dev"],
  [createYearDevWorker, "create-year-dev"], [updateYearDevWorker, "update-year-dev"], [excludeYearDevWorker, "exclude-year-dev"],
  [createCompletedTaskDevWorker, "create-completed-task-dev"], [updateCompletedTaskDevWorker, "update-completed-task-dev"], [excludeCompletedTaskDevWorker, "exclude-completed-task-dev"],
] as const;

for (const [worker, queue] of workers) observeWorker(worker, queue);
