import { env } from "../../config/env";
import databaseNotionPromise from "../../db/notion";
import notion from "../../libs/notion";
import { mapRecordCustomer } from "./mapRecord";

export async function retrieveCustomer(name: string, id?: number) {
  const database = await databaseNotionPromise;

  if (id) {
    const customer = await database.findFirst<{ id: number, name: string, notion_id: string }>({
      table: "customers",
      where: { id },
      select: { id: true, name: true, notion_id: true }
    });

    return customer
  }

  if (name && name.length > 2) {
    const existingCustomer = await database.findFirst<{ id: number, name: string, notion_id: string }>({
      table: "customers",
      where: { name },
      select: { id: true, name: true, notion_id: true }
    });

    if (existingCustomer) {
      return existingCustomer;
    } else {
      const newCustomerNotion = (await notion.pages.create({
        parent: { data_source_id: env.dataSourceCustomer },
        properties: { "Nome": { title: [{ text: { content: name } }] } },
        template: { type: "template_id", template_id: env.templateCustomer }
      })) as any;

      const dataCustomer = mapRecordCustomer(newCustomerNotion.properties);

      const newCustomer = await database.insertIntoTable<{ id: number }>({
        table: "customers",
        dataDict: { name: dataCustomer.name, data: dataCustomer, notion_id: newCustomerNotion.id },
        select: { id: true },
      });

      if (newCustomer) {
        const updateCustomer = (await notion.pages.update({
          page_id: newCustomerNotion.id,
          properties: { ID: { number: newCustomer.id } },
        })) as any;

        await database.updateIntoTable({
          table: "customers",
          dataDict: { updated_at: new Date(updateCustomer.last_edited_time) },
          where: { id: newCustomer.id },
        });

        return { id: newCustomer.id, name: dataCustomer.name, notion_id: newCustomerNotion.id };
      }
    }
  }
}
