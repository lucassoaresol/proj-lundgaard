import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { mapRecordCustomer } from "./mapRecord";


export async function createCustomer(notion_id: string) {
  const database = await databaseNotionPromise

  const customerExistin = await database.findFirst({ table: "customers", where: { notion_id }, select: { "id": true } })

  if (!customerExistin) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;

    const data = mapRecordCustomer(result.properties);

    const { name } = data

    const customerDataExistin = await database.findFirst({ table: "customers", where: { name }, select: { "id": true } })

    if (!customerDataExistin) {
      const newCustomer = await database.insertIntoTable<{ id: number }>({
        table: "customers",
        dataDict: { name, data, notion_id },
        select: { id: true },
      });

      if (newCustomer) {
        const updateCustomer = (await notion.pages.update({
          page_id: notion_id,
          properties: { ID: { number: newCustomer.id } },
        })) as any;

        await database.updateIntoTable({
          table: "customers",
          dataDict: {
            updated_at: dayLib(updateCustomer.last_edited_time).toDate(),
          },
          where: { id: newCustomer.id },
        });
      }
    } else {
      await notion.pages.update({ page_id: notion_id, in_trash: true })
    }
  }
}
