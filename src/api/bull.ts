import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";

import {
  createCustomerQueue,
  excludeCustomerQueue,
  updateCustomerQueue,
} from "../worker/services/customer";
import {
  createTaskQueue,
  excludeTaskQueue,
  updateTaskQueue,
} from "../worker/services/task";

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
  ],
  serverAdapter: serverAdapter,
});
