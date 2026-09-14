import { Worker } from "bullmq";
import { createYear } from "../../models/year/create";
import { excludeYear } from "../../models/year/exclude";
import { updateYear } from "../../models/year/update";
import { runWithRetryPolicy } from "../retryPolicy";

export const createYearWorker = new Worker<string>(
  "create-year",
  async (job) => {
    await runWithRetryPolicy(() => createYear(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const updateYearWorker = new Worker<string>(
  "update-year",
  async (job) => {
    await runWithRetryPolicy(() => updateYear(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);

export const excludeYearWorker = new Worker<string>(
  "exclude-year",
  async (job) => {
    await runWithRetryPolicy(() => excludeYear(job.data));
  },
  {
    connection: {},
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    prefix: "notion-lundgaard",
  },
);
