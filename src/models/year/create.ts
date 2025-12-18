import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { mapRecordYear } from "./mapRecord";

export async function createYear(notion_id: string) {
  const database = await databaseNotionPromise

  const yearExistin = await database.findFirst({ table: "years", where: { notion_id }, select: { "id": true } })

  if (!yearExistin) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;

    const data = mapRecordYear(result.properties);

    const { year } = data

    const yearDataExistin = await database.findFirst({ table: "years", where: { year }, select: { "id": true } })

    if (!yearDataExistin) {
      const newYear = await database.insertIntoTable<{ id: number }>({
        table: "years",
        dataDict: { year, data, notion_id },
        select: { id: true },
      });

      if (newYear) {
        const updateYear = (await notion.pages.update({
          page_id: notion_id,
          properties: { ID: { number: newYear.id } },
        })) as any;

        await database.updateIntoTable({
          table: "years",
          dataDict: {
            updated_at: dayLib(updateYear.last_edited_time).toDate(),
          },
          where: { id: newYear.id },
        });
      }
    } else {
      await notion.pages.update({ page_id: notion_id, in_trash: true })
    }
  }
}
