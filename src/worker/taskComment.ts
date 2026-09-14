import { observeWorker } from "./observeWorker";
import { createTaskCommentWorker, excludeTaskCommentWorker, updateTaskCommentWorker } from "./services/taskComment";

observeWorker(createTaskCommentWorker, "create-task-comment");
observeWorker(updateTaskCommentWorker, "update-task-comment");
observeWorker(excludeTaskCommentWorker, "exclude-task-comment");
