import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";

import {
  createCompletedTaskQueue,
  updateCompletedTaskQueue,
  excludeCompletedTaskQueue,
} from "../worker/services/completedTask";
import {
  createCustomerQueue,
  updateCustomerQueue,
  excludeCustomerQueue,
} from "../worker/services/customer";
import {
  createTaskQueue,
  updateTaskQueue,
  excludeTaskQueue,
} from "../worker/services/task";
import {
  createTaskCommentQueue,
  updateTaskCommentQueue,
  excludeTaskCommentQueue,
} from "../worker/services/taskComment";
import {
  createYearQueue,
  updateYearQueue,
  excludeYearQueue,
} from "../worker/services/year";

export const serverAdapter = new FastifyAdapter();

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(createCustomerQueue),
    new BullMQAdapter(updateCustomerQueue),
    new BullMQAdapter(excludeCustomerQueue),
    new BullMQAdapter(createTaskQueue),
    new BullMQAdapter(updateTaskQueue),
    new BullMQAdapter(excludeTaskQueue),
    new BullMQAdapter(createTaskCommentQueue),
    new BullMQAdapter(updateTaskCommentQueue),
    new BullMQAdapter(excludeTaskCommentQueue),
    new BullMQAdapter(createYearQueue),
    new BullMQAdapter(updateYearQueue),
    new BullMQAdapter(excludeYearQueue),
    new BullMQAdapter(createCompletedTaskQueue),
    new BullMQAdapter(updateCompletedTaskQueue),
    new BullMQAdapter(excludeCompletedTaskQueue),
  ],
  serverAdapter: serverAdapter,
});
