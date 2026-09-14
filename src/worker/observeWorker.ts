import { createHash } from "node:crypto";
import type { Worker } from "bullmq";

import { classifyJobError } from "./retryPolicy";

function sanitizedRef(value: string | number | undefined): string {
  return createHash("sha256").update(String(value ?? "unknown")).digest("hex").slice(0, 10);
}

export function observeWorker(worker: Worker, queue: string): void {
  worker.on("completed", (job) => {
    console.log("job_completed", { queue, job: job.name, jobRef: sanitizedRef(job.id) });
  });

  worker.on("failed", (job, error) => {
    const classification = classifyJobError(error);
    console.error("job_failed", {
      queue,
      job: job?.name ?? "unknown",
      jobRef: sanitizedRef(job?.id),
      attemptsMade: job?.attemptsMade ?? 0,
      errorClass: classification.errorClass,
      retryable: classification.retryable,
    });
  });
}
