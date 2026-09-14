import { observeWorker } from "./observeWorker";
import { createTaskWorker, excludeTaskWorker, updateTaskAssigneeWorker, updateTaskCustomerWorker, updateTaskWorker } from "./services/task";

observeWorker(createTaskWorker, "create-task");
observeWorker(updateTaskWorker, "update-task");
observeWorker(updateTaskAssigneeWorker, "update-task-assignee");
observeWorker(updateTaskCustomerWorker, "update-task-customer");
observeWorker(excludeTaskWorker, "exclude-task");
