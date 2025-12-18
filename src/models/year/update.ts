import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { mapRecordYear } from "./mapRecord";

export async function updateYear(notion_id: string) {
  const database = await databaseNotionPromise

  const yearData = await database.findFirst<{ id: number, updated_at: Date }>({
    table: "years",
    where: { notion_id },
    select: { id: true, updated_at: true },
  });

  if (yearData) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;
    const updated_at = dayLib(result.last_edited_time)
    const data = mapRecordYear(result.properties);
    const { year } = data

    if (updated_at.diff(yearData.updated_at) > 0) {
      const yearExistin = await database.findFirst<{ notion_id: string }>({ table: "years", where: { year }, select: { "notion_id": true } })

      if (yearExistin) {
        await notion.pages.update({ page_id: notion_id, in_trash: true })
        await database.deleteFromTable({ table: "years", where: { id: yearData.id } })
      } else {
        await database.updateIntoTable({ table: "years", dataDict: { year, data, updated_at: updated_at.toDate() }, where: { id: yearData.id } })
      }
    }
  }
}
