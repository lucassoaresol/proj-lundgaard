import { Worker } from "bullmq";
import { createCustomer } from "../../models/customer/create";
import { updateCustomer } from "../../models/customer/update";
import { excludeCustomer } from "../../models/customer/exclude";
import { runWithRetryPolicy } from "../retryPolicy";

export const createCustomerWorker = new Worker<string>(
  "create-customer",
  async (job) => {
    await runWithRetryPolicy(() => createCustomer(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateCustomerWorker = new Worker<string>(
  "update-customer",
  async (job) => {
    await runWithRetryPolicy(() => updateCustomer(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const excludeCustomerWorker = new Worker<string>(
  "exclude-customer",
  async (job) => {
    await runWithRetryPolicy(() => excludeCustomer(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);
