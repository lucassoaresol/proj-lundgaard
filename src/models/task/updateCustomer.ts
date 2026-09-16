import { createHash } from "node:crypto";

import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { classifyJobError } from "../../worker/retryPolicy";
import { retrieveCustomer } from "../customer/retrieve";

import {
  compareAndSetCustomerReconciliationMarker,
  compareAndSetTaskData,
  isNotionInaccessibleErrorClass,
} from "./customerReconciliation";
import { mapRecordTask } from "./mapRecord";

export async function updateTaskCustomer(
  notion_id: string,
  project: string,
  customer_id: unknown,
) {
  let customer = await retrieveCustomer(
    project,
    customer_id as number | undefined,
  );
  const database = await databaseNotionPromise;

  const task = await database.findFirst<{
    id: number;
    customer_id: number | null;
    data: unknown;
  }>({
    table: "tasks",
    where: { notion_id },
    select: { id: true, customer_id: true, data: true },
  });

  if (!task) return;

  if (customer && project && project.trim().toUpperCase() !== customer.name) {
    customer = await retrieveCustomer(project);
  }

  if (!customer) {
    const update = compareAndSetCustomerReconciliationMarker(
      task.id,
      task.data,
      "unresolved_reference",
      new Date(),
    );
    await database.updateIntoTable({
      table: "tasks",
      ...update,
    });
    console.warn("customer_reference_unresolved", {
      errorClass: "STALE_CUSTOMER_REFERENCE",
      retryable: false,
      taskRef: createHash("sha256")
        .update(notion_id)
        .digest("hex")
        .slice(0, 10),
    });
    return;
  }

  if (task.customer_id === customer.id && Number(customer_id) === customer.id)
    return;

  let updateTask: any;
  try {
    updateTask = await notion.pages.update({
      page_id: notion_id,
      properties: { Cliente: { relation: [{ id: customer.notion_id }] } },
    });
  } catch (error) {
    const classification = classifyJobError(error);
    if (isNotionInaccessibleErrorClass(classification.errorClass)) {
      const update = compareAndSetCustomerReconciliationMarker(
        task.id,
        task.data,
        "notion_inaccessible",
        new Date(),
      );
      await database.updateIntoTable({
        table: "tasks",
        ...update,
      });
      console.warn("task_customer_notion_inaccessible", {
        errorClass: classification.errorClass,
        retryable: classification.retryable,
        taskRef: createHash("sha256")
          .update(notion_id)
          .digest("hex")
          .slice(0, 10),
      });
    } else {
      const update = compareAndSetCustomerReconciliationMarker(
        task.id,
        task.data,
        classification.retryable ? "transient_failure" : "permanent_failure",
        new Date(),
        classification.retryable ? 1 : undefined,
      );
      await database.updateIntoTable({
        table: "tasks",
        ...update,
      });
    }
    throw error;
  }
  const updated_at = dayLib(updateTask.last_edited_time);
  const data = mapRecordTask(updateTask.properties);
  const dataUpdate = compareAndSetTaskData(task.id, task.data, data);

  await database.updateIntoTable({
    table: "tasks",
    dataDict: {
      ...dataUpdate.dataDict,
      customer_id: customer.id,
      updated_at: updated_at.toDate(),
    },
    where: dataUpdate.where,
  });
}
