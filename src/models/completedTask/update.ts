import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { createCompletedTaskQueue } from "../../worker/services/completedTask";
import { retrieveYear } from "../year/retrieve";
import { mapRecordCompletedTask } from "./mapRecord";

export async function updateCompletedTask(notion_id: string, data_source_id: number) {
  const database = await databaseNotionPromise

  const completedTaskData = await database.findFirst<{ id: number, data: any, updated_at: Date }>({
    table: "completed_tasks",
    where: { notion_id },
    select: { id: true, data: true, updated_at: true },
  });

  if (completedTaskData) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;
    let updated_at = dayLib(result.last_edited_time)
    const data = mapRecordCompletedTask(result.properties);
    const { year_id } = data

    if (updated_at.diff(completedTaskData.updated_at) > 0) {
      let year = await retrieveYear(data.completion_dates.match(/\d+/)?.[0] || "", year_id);
      if (!year_id && year) {
        const updateCompletedTask = (await notion.pages.update({ page_id: notion_id, properties: { "Year": { relation: [{ id: year.notion_id }] } } })) as any
        updated_at = dayLib(updateCompletedTask.last_edited_time)
        await database.updateIntoTable({ table: "completed_tasks", dataDict: { data, year_id: year.id, updated_at: updated_at.toDate() }, where: { id: completedTaskData.id } })
      } else if (year && data.completion_dates.length > 2 && data.completion_dates.match(/\d+/)?.[0] !== year.year) {
        year = await retrieveYear(data.completion_dates.match(/\d+/)?.[0] || "")
        if (year) {
          const updateCompletedTask = (await notion.pages.update({ page_id: notion_id, properties: { "Year": { relation: [{ id: year.notion_id }] } } })) as any
          updated_at = dayLib(updateCompletedTask.last_edited_time)
          await database.updateIntoTable({ table: "completed_tasks", dataDict: { data, year_id: year.id, updated_at: updated_at.toDate() }, where: { id: completedTaskData.id } })
        }
      } else {
        await database.updateIntoTable({ table: "completed_tasks", dataDict: { data, year_id, updated_at: updated_at.toDate() }, where: { id: completedTaskData.id } })
      }

      if (data.people && data.people !== completedTaskData.data.people) {
        const updateTask = (await notion.pages.update({ page_id: notion_id, properties: { "Assignee": { select: { name: data.people } } } })) as any
        updated_at = dayLib(updateTask.last_edited_time)
        await database.updateIntoTable({ table: "completed_tasks", dataDict: { data, updated_at: updated_at.toDate() }, where: { id: completedTaskData.id } })
      }
    }
  } else {
    await createCompletedTaskQueue.add("save-create-completed-task", { notion_id, data_source_id }, {
      attempts: 1000,
      backoff: { type: "exponential", delay: 5000 },
    });
  }
}
