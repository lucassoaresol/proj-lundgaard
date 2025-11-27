import { Queue, Worker } from "bullmq";
import { createCustomer } from "../../models/customer/create";
import { updateCustomer } from "../../models/customer/update";
import { excludeCustomer } from "../../models/customer/exclude";

export const createCustomerQueue = new Queue<string>("create-customer", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const createCustomerWorker = new Worker<string>(
  "create-customer",
  async (job) => {
    await createCustomer(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateCustomerQueue = new Queue<string>("update-customer", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const updateCustomerWorker = new Worker<string>(
  "update-customer",
  async (job) => {
    await updateCustomer(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const excludeCustomerQueue = new Queue<string>("exclude-customer", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const excludeCustomerWorker = new Worker<string>(
  "exclude-customer",
  async (job) => {
    await excludeCustomer(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);






