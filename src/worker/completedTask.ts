import { observeWorker } from "./observeWorker";
import { createCompletedTaskWorker, excludeCompletedTaskWorker, updateCompletedTaskWorker } from "./services/completedTask";

observeWorker(createCompletedTaskWorker, "create-completed-task");
observeWorker(updateCompletedTaskWorker, "update-completed-task");
observeWorker(excludeCompletedTaskWorker, "exclude-completed-task");
