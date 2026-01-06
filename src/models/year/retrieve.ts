import databaseNotionPromise from "../../db/notion";
import notion from "../../libs/notion";
import { getStorage } from "../../utils/getStorage";
import { mapRecordYear } from "./mapRecord";

export async function retrieveYear(year: string, id?: number) {
  const [dataSourceYear, templateYear] = await Promise.all([getStorage("DATA_SOURCE_YEAR"), getStorage("TEMPLATE_YEAR")])

  if (dataSourceYear && templateYear) {
    const database = await databaseNotionPromise;

    if (id) {
      const yearRecord = await database.findFirst<{ id: number, year: string, notion_id: string }>({
        table: "years",
        where: { id },
        select: { id: true, year: true, notion_id: true }
      });

      return yearRecord
    }

    if (year && year.length > 2) {
      const existingYear = await database.findFirst<{ id: number, year: string, notion_id: string }>({
        table: "years",
        where: { year },
        select: { id: true, year: true, notion_id: true }
      });

      if (existingYear) {
        return existingYear;
      } else {
        const newYearNotion = (await notion.pages.create({
          parent: { data_source_id: dataSourceYear.data },
          properties: { "Year": { title: [{ text: { content: year } }] } },
          template: { type: "template_id", template_id: templateYear.data }
        })) as any;

        const dataYear = mapRecordYear(newYearNotion.properties);

        const newYear = await database.insertIntoTable<{ id: number }>({
          table: "years",
          dataDict: { year: dataYear.year, data: dataYear, notion_id: newYearNotion.id },
          select: { id: true },
        });

        if (newYear) {
          const updateYear = (await notion.pages.update({
            page_id: newYearNotion.id,
            properties: { ID: { number: newYear.id } },
          })) as any;

          await database.updateIntoTable({
            table: "years",
            dataDict: { updated_at: new Date(updateYear.last_edited_time) },
            where: { id: newYear.id },
          });

          return { id: newYear.id, year: dataYear.year, notion_id: newYearNotion.id };
        }
      }
    }
  }
}
