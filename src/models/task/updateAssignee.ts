import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { mapRecordTask } from "./mapRecord";

export async function updateTaskAssignee(notion_id: string, assignee: string) {
  const database = await databaseNotionPromise;

  const updateTask = await notion.pages.update({
    page_id: notion_id,
    properties: {
      "Assignee": { select: { name: assignee } }
    }
  }) as any;

  const updated_at = dayLib(updateTask.last_edited_time);
  const data = mapRecordTask(updateTask.properties);
  await database.updateIntoTable({
    table: "tasks",
    dataDict: { data, updated_at: updated_at.toDate() },
    where: { notion_id }
  });
}
