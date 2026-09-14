import databaseNotionPromise from "../../db/notion";
import notion from "../../libs/notion";
import { isUniqueViolation } from "../../utils/databaseError";
import { getStorage } from "../../utils/getStorage";
import { mapRecordCustomer } from "./mapRecord";
import { CustomerReference, resolveCustomerReference } from "./reference";

export async function retrieveCustomer(name: string, id?: number): Promise<CustomerReference | undefined> {
  const database = await databaseNotionPromise;

  return resolveCustomerReference(name, id, {
    findById: (customerId) => database.findFirst<CustomerReference>({
      table: "customers",
      where: { id: customerId },
      select: { id: true, name: true, notion_id: true },
    }),
    findByName: (customerName) => database.findFirst<CustomerReference>({
      table: "customers",
      where: { name: customerName },
      select: { id: true, name: true, notion_id: true },
    }),
    createByName: async (customerName) => {
      const [dataSourceCustomer, templateCustomer] = await Promise.all([
        getStorage("DATA_SOURCE_CUSTOMER"),
        getStorage("TEMPLATE_CUSTOMER"),
      ]);
      if (!dataSourceCustomer || !templateCustomer) return undefined;

      const notionPage = (await notion.pages.create({
        parent: { data_source_id: dataSourceCustomer.data },
        properties: { "Nome": { title: [{ text: { content: customerName } }] } },
        template: { type: "template_id", template_id: templateCustomer.data },
      })) as any;
      const data = mapRecordCustomer(notionPage.properties);

      let inserted: { id: number } | undefined;
      try {
        inserted = (await database.insertIntoTable<{ id: number }>({
          table: "customers",
          dataDict: { name: data.name, data, notion_id: notionPage.id },
          select: { id: true },
        })) || undefined;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        const winner = await database.findFirst<CustomerReference>({
          table: "customers",
          where: { name: data.name },
          select: { id: true, name: true, notion_id: true },
        });
        if (winner) return winner;
        throw error;
      }

      if (!inserted) return undefined;
      const updated = (await notion.pages.update({
        page_id: notionPage.id,
        properties: { ID: { number: inserted.id } },
      })) as any;
      await database.updateIntoTable({
        table: "customers",
        dataDict: { updated_at: new Date(updated.last_edited_time) },
        where: { id: inserted.id },
      });

      return { id: inserted.id, name: data.name, notion_id: notionPage.id };
    },
  });
}
