import { createHash } from "node:crypto";

import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { classifyJobError } from "../../worker/retryPolicy";
import { retrieveCustomer } from "../customer/retrieve";

import {
  isNotionInaccessibleErrorClass,
  withCustomerReconciliationMarker,
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
    await database.updateIntoTable({
      table: "tasks",
      dataDict: {
        data: withCustomerReconciliationMarker(
          task.data,
          "unresolved_reference",
          new Date(),
        ),
      },
      where: { id: task.id },
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
      await database.updateIntoTable({
        table: "tasks",
        dataDict: {
          data: withCustomerReconciliationMarker(
            task.data,
            "notion_inaccessible",
            new Date(),
          ),
        },
        where: { id: task.id },
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
      await database.updateIntoTable({
        table: "tasks",
        dataDict: {
          data: withCustomerReconciliationMarker(
            task.data,
            classification.retryable
              ? "transient_failure"
              : "permanent_failure",
            new Date(),
            classification.retryable ? 1 : undefined,
          ),
        },
        where: { id: task.id },
      });
    }
    throw error;
  }
  const updated_at = dayLib(updateTask.last_edited_time);
  const data = mapRecordTask(updateTask.properties);

  await database.updateIntoTable({
    table: "tasks",
    dataDict: {
      data,
      customer_id: customer.id,
      updated_at: updated_at.toDate(),
    },
    where: { id: task.id },
  });
}
