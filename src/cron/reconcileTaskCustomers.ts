import { createHash } from "node:crypto";

import {
  compareAndSetCustomerReconciliationMarker,
  compareAndSetTaskData,
  CUSTOMER_QUEUE_BATCH_LIMIT,
  customerJobData,
  CustomerReconciliationTask,
  hasUsableCustomerReference,
  isNotionInaccessibleErrorClass,
  selectCustomerReconciliationBatch,
  TaskDataCompareAndSet,
  withCustomerReconciliationMarker,
} from "../models/task/customerReconciliation";
import type { JobErrorClassification } from "../worker/retryPolicy";

type Dependencies = {
  listTasks: () => Promise<CustomerReconciliationTask[]>;
  enqueue: (data: ReturnType<typeof customerJobData>) => Promise<unknown>;
  retrievePage: (notionId: string) => Promise<unknown>;
  mapPage: (page: unknown) => unknown;
  saveTaskData: (update: TaskDataCompareAndSet) => Promise<unknown>;
  classifyError: (error: unknown) => JobErrorClassification;
  logError?: (event: string, context: Record<string, unknown>) => void;
};

function taskRef(notionId: string): string {
  return createHash("sha256").update(notionId).digest("hex").slice(0, 10);
}

export async function reconcileTaskCustomers(
  dependencies: Dependencies,
  now = new Date(),
): Promise<{ enqueued: number; probed: number; quarantined: number }> {
  const tasks = await dependencies.listTasks();
  const selection = selectCustomerReconciliationBatch(tasks, now);
  const logError = dependencies.logError ?? console.error;
  let enqueued = 0;
  let enqueueAttempts = 0;
  let quarantined = 0;

  for (const task of selection.direct) {
    try {
      enqueueAttempts += 1;
      await dependencies.enqueue(customerJobData(task));
      enqueued += 1;
    } catch (error) {
      const classification = dependencies.classifyError(error);
      logError("cron_task_customer_enqueue_failed", {
        queue: "update-task-customer",
        job: "save-update-task-customer",
        taskRef: taskRef(task.notion_id),
        errorClass: classification.errorClass,
        retryable: classification.retryable,
      });
    }
  }

  for (const task of selection.probes) {
    try {
      const page = await dependencies.retrievePage(task.notion_id);
      const data = dependencies.mapPage(page);

      if (!hasUsableCustomerReference(data)) {
        await dependencies.saveTaskData(
          compareAndSetTaskData(
            task.id,
            task.data,
            withCustomerReconciliationMarker(
              data,
              "no_customer_reference",
              now,
            ),
          ),
        );
        quarantined += 1;
        continue;
      }

      await dependencies.saveTaskData(
        compareAndSetTaskData(task.id, task.data, data),
      );
      if (enqueueAttempts < CUSTOMER_QUEUE_BATCH_LIMIT) {
        enqueueAttempts += 1;
        await dependencies.enqueue(customerJobData({ ...task, data }));
        enqueued += 1;
      }
    } catch (error) {
      const classification = dependencies.classifyError(error);

      if (isNotionInaccessibleErrorClass(classification.errorClass)) {
        await dependencies.saveTaskData(
          compareAndSetCustomerReconciliationMarker(
            task.id,
            task.data,
            "notion_inaccessible",
            now,
          ),
        );
        quarantined += 1;
      } else if (classification.retryable) {
        await dependencies.saveTaskData(
          compareAndSetCustomerReconciliationMarker(
            task.id,
            task.data,
            "transient_failure",
            now,
            1,
          ),
        );
      } else {
        await dependencies.saveTaskData(
          compareAndSetCustomerReconciliationMarker(
            task.id,
            task.data,
            "permanent_failure",
            now,
          ),
        );
        quarantined += 1;
      }

      logError("cron_task_customer_probe_failed", {
        queue: "update-task-customer",
        job: "save-update-task-customer",
        taskRef: taskRef(task.notion_id),
        errorClass: classification.errorClass,
        retryable: classification.retryable,
      });
    }
  }

  return { enqueued, probed: selection.probes.length, quarantined };
}
