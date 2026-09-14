import databaseNotionPromise from "../../db/notion";
import { createHash } from "node:crypto";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { retrieveCustomer } from "../customer/retrieve";
import { mapRecordTask } from "./mapRecord";

export async function updateTaskCustomer(notion_id: string, project: string, customer_id: unknown) {
  let customer = await retrieveCustomer(project, customer_id as number | undefined);
  const database = await databaseNotionPromise;

  const task = await database.findFirst<{ id: number; customer_id: number | null }>({
    table: "tasks",
    where: { notion_id },
    select: { id: true, customer_id: true },
  });

  if (!task) return;

  if (customer && project && project.trim().toUpperCase() !== customer.name) {
    customer = await retrieveCustomer(project);
  }

  if (!customer) {
    console.warn("customer_reference_unresolved", {
      errorClass: "STALE_CUSTOMER_REFERENCE",
      retryable: false,
      taskRef: createHash("sha256").update(notion_id).digest("hex").slice(0, 10),
    });
    return;
  }

  if (task.customer_id === customer.id && Number(customer_id) === customer.id) return;

  const updateTask = await notion.pages.update({
    page_id: notion_id,
    properties: { "Cliente": { relation: [{ id: customer.notion_id }] } },
  }) as any;
  const updated_at = dayLib(updateTask.last_edited_time);
  const data = mapRecordTask(updateTask.properties);

  await database.updateIntoTable({
    table: "tasks",
    dataDict: { data, customer_id: customer.id, updated_at: updated_at.toDate() },
    where: { id: task.id },
  });
}
