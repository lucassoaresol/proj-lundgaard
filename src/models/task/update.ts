import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { mapRecordTask } from "./mapRecord";

export async function updateTask(notion_id: string) {
  const database = await databaseNotionPromise

  const taskData = await database.findFirst<{ id: number, updated_at: Date }>({
    table: "tasks",
    where: { notion_id },
    select: { id: true, updated_at: true },
  });

  if (taskData) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;
    const updated_at = dayLib(result.last_edited_time)
    const data = mapRecordTask(result.properties);
    const { customer_id } = data

    if (updated_at.diff(taskData.updated_at) > 0) {
      await database.updateIntoTable({ table: "tasks", dataDict: { data, customer_id, updated_at: updated_at.toDate() }, where: { id: taskData.id } })
    }
  }
}
