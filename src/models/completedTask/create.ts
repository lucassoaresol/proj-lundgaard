import { MONTHS } from "../../config/const";
import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { retrieveYear } from "../year/retrieve";
import { mapRecordCompletedTask } from "./mapRecord";

export async function createCompletedTask(notion_id: string, data_source_id: number) {
  const database = await databaseNotionPromise

  const completedTaskExistin = await database.findFirst({ table: "completed_tasks", where: { notion_id }, select: { "id": true } })

  if (!completedTaskExistin) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;

    const data = mapRecordCompletedTask(result.properties);

    const year = await retrieveYear(data.completion_dates.match(/\d+/)?.[0] || "", data.year_id);

    const newCompletedTask = await database.insertIntoTable<{ id: number }>({
      table: "completed_tasks",
      dataDict: { data, year_id: year?.id, data_source_id, notion_id },
      select: { id: true },
    });

    if (newCompletedTask) {
      let propertiesData = {}
      let dataDict = {}

      if (year) {
        propertiesData = {
          ...propertiesData, "Year": { relation: [{ id: year.notion_id }] }
        };
        dataDict = { ...dataDict, year_id: year.id };
      }

      if (!data.month && data.completion_dates.length > 2) {
        const month = data.completion_dates.split(" - ")[1].split(" ")[0];
        propertiesData = {
          ...propertiesData, "Month": { select: { name: MONTHS[month.toUpperCase()] } }
        };
      }

      if (data.assignee.length < 2 && data.people) {
        propertiesData = {
          ...propertiesData, "Assignee": { select: { name: data.people } }
        }
      }

      const updateCompletedTask = (await notion.pages.update({
        page_id: notion_id,
        properties: { ID: { number: newCompletedTask.id }, ...propertiesData },
      })) as any;

      if (Object.keys(propertiesData).length) {
        const dataUpdate = mapRecordCompletedTask(updateCompletedTask.properties);
        dataDict = { ...dataDict, data: dataUpdate }
      }

      await database.updateIntoTable({
        table: "completed_tasks",
        dataDict: {
          updated_at: dayLib(updateCompletedTask.last_edited_time).toDate(), ...dataDict
        },
        where: { id: newCompletedTask.id },
      });
    }
  }
}
