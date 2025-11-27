import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { mapRecordCustomer } from "./mapRecord";

export async function updateCustomer(notion_id: string) {
  const database = await databaseNotionPromise

  const customerData = await database.findFirst<{ id: number, updated_at: Date }>({
    table: "customers",
    where: { notion_id },
    select: { id: true, updated_at: true },
  });

  if (customerData) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;
    const updated_at = result.last_edited_time
    const data = mapRecordCustomer(result.properties);
    const { name, tasks } = data

    if (dayLib(updated_at).diff(customerData.updated_at) > 0) {
      const customerExistin = await database.findFirst<{ notion_id: string }>({ table: "customers", where: { name }, select: { "notion_id": true } })

      if (customerExistin) {
        for (const taskId of tasks) {
          await notion.pages.update({ page_id: taskId, properties: { "Cliente": { "relation": [{ id: customerExistin.notion_id }] } } })
        }
        await notion.pages.update({ page_id: notion_id, in_trash: true })
        await database.deleteFromTable({ table: "customers", where: { id: customerData.id } })
      } else {
        await database.updateIntoTable({ table: "customers", dataDict: { name, data, updated_at: dayLib(updated_at).toDate() }, where: { id: customerData.id } })
      }
    }
  }
}
