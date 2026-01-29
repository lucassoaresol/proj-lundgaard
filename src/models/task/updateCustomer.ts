import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { retrieveCustomer } from "../customer/retrieve";
import { mapRecordTask } from "./mapRecord";

export async function updateTaskCustomer(notion_id: string, project: string, customer_id: any) {
  let updated_at: any;
  let data: any;
  let customer = await retrieveCustomer(project, customer_id);
  const database = await databaseNotionPromise;

  const task = await database.findFirst<{ id: number }>({ table: "tasks", where: { notion_id, customer_id: null }, select: { id: true } })

  if (task) {
    await database.updateIntoTable({
      table: "tasks",
      dataDict: { customer_id },
      where: { id: task.id }
    });
  } else if (!customer_id && customer) {
    const updateTask = await notion.pages.update({
      page_id: notion_id,
      properties: {
        "Cliente": { relation: [{ id: customer.notion_id }] }
      }
    }) as any;
    updated_at = dayLib(updateTask.last_edited_time);
    data = mapRecordTask(updateTask.properties);
    await database.updateIntoTable({
      table: "tasks",
      dataDict: { data, customer_id: customer.id, updated_at: updated_at.toDate() },
      where: { notion_id }
    });
  } else if (customer && project !== customer.name) {
    customer = await retrieveCustomer(project);
    if (customer) {
      const updateTask = await notion.pages.update({
        page_id: notion_id,
        properties: {
          "Cliente": { relation: [{ id: customer.notion_id }] }
        }
      }) as any;
      updated_at = dayLib(updateTask.last_edited_time);
      data = mapRecordTask(updateTask.properties);
      await database.updateIntoTable({
        table: "tasks",
        dataDict: { data, customer_id: customer.id, updated_at: updated_at.toDate() },
        where: { notion_id }
      });
    }
  }
}
