import { Queue, Worker } from "bullmq";
import { createYear } from "../../models/year/create";
import { excludeYear } from "../../models/year/exclude";
import { updateYear } from "../../models/year/update";

export const createYearQueue = new Queue<string>("create-year", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const createYearWorker = new Worker<string>(
  "create-year",
  async (job) => {
    await createYear(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateYearQueue = new Queue<string>("update-year", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const updateYearWorker = new Worker<string>(
  "update-year",
  async (job) => {
    await updateYear(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const excludeYearQueue = new Queue<string>("exclude-year", {
  connection: {},
  prefix: "notion-lundgaard",
});

export const excludeYearWorker = new Worker<string>(
  "exclude-year",
  async (job) => {
    await excludeYear(job.data)
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);
