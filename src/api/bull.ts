import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";

import {
  createCompletedTaskQueue,
  updateCompletedTaskQueue,
  excludeCompletedTaskQueue,
} from "../queues";
import {
  createCustomerQueue,
  updateCustomerQueue,
  excludeCustomerQueue,
} from "../queues";
import {
  createTaskQueue,
  updateTaskQueue,
  excludeTaskQueue,
  updateTaskAssigneeQueue,
  updateTaskCustomerQueue,
} from "../queues";
import {
  createTaskCommentQueue,
  updateTaskCommentQueue,
  excludeTaskCommentQueue,
} from "../queues";
import {
  createYearQueue,
  updateYearQueue,
  excludeYearQueue,
} from "../queues";

export const serverAdapter = new FastifyAdapter();

serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(createCustomerQueue),
    new BullMQAdapter(updateCustomerQueue),
    new BullMQAdapter(excludeCustomerQueue),
    new BullMQAdapter(createTaskQueue),
    new BullMQAdapter(updateTaskQueue),
    new BullMQAdapter(updateTaskAssigneeQueue),
    new BullMQAdapter(updateTaskCustomerQueue),
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
