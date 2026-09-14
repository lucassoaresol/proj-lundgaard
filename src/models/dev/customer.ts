import databaseNotionDevPromise from "../../db/dev/notionDev";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { isUniqueViolation } from "../../utils/databaseError";
import { getStorageDev } from "../../utils/dev/getStorageDev";
import { mapRecordCustomer } from "../customer/mapRecord";
import { CustomerReference, resolveCustomerReference } from "../customer/reference";

export async function retrieveCustomerDev(name: string, id?: number): Promise<CustomerReference | undefined> {
  const database = await databaseNotionDevPromise;
  return resolveCustomerReference(name, id, {
    findById: (value) => database.findFirst({ table: "customers", where: { id: value }, select: { id: true, name: true, notion_id: true } }),
    findByName: (value) => database.findFirst({ table: "customers", where: { name: value }, select: { id: true, name: true, notion_id: true } }),
    createByName: async (value) => {
      const [source, template] = await Promise.all([getStorageDev("DATA_SOURCE_CUSTOMER"), getStorageDev("TEMPLATE_CUSTOMER")]);
      if (!source || !template) return undefined;
      const page = (await notion.pages.create({
        parent: { data_source_id: source.data },
        properties: { Nome: { title: [{ text: { content: value } }] } },
        template: { type: "template_id", template_id: template.data },
      })) as any;
      const data = mapRecordCustomer(page.properties);
      let inserted: { id: number } | undefined;
      try {
        inserted = (await database.insertIntoTable<{ id: number }>({ table: "customers", dataDict: { name: data.name, data, notion_id: page.id }, select: { id: true } })) || undefined;
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        return (await database.findFirst<CustomerReference>({ table: "customers", where: { name: data.name }, select: { id: true, name: true, notion_id: true } })) || undefined;
      }
      if (!inserted) return undefined;
      const updated = (await notion.pages.update({ page_id: page.id, properties: { ID: { number: inserted.id } } })) as any;
      await database.updateIntoTable({ table: "customers", dataDict: { updated_at: new Date(updated.last_edited_time) }, where: { id: inserted.id } });
      return { id: inserted.id, name: data.name, notion_id: page.id };
    },
  });
}

export async function createCustomerDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  const existing = await database.findFirst({ table: "customers", where: { notion_id: notionId }, select: { id: true } });
  if (existing) return;
  const page = (await notion.pages.retrieve({ page_id: notionId })) as any;
  const data = mapRecordCustomer(page.properties);
  const duplicate = await database.findFirst({ table: "customers", where: { name: data.name }, select: { id: true } });
  if (duplicate) {
    await notion.pages.update({ page_id: notionId, in_trash: true });
    return;
  }
  try {
    const inserted = await database.insertIntoTable<{ id: number }>({ table: "customers", dataDict: { name: data.name, data, notion_id: notionId }, select: { id: true } });
    if (inserted) {
      const updated = (await notion.pages.update({ page_id: notionId, properties: { ID: { number: inserted.id } } })) as any;
      await database.updateIntoTable({ table: "customers", dataDict: { updated_at: dayLib(updated.last_edited_time).toDate() }, where: { id: inserted.id } });
    }
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }
}

export async function updateCustomerDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  const row = await database.findFirst<{ id: number; updated_at: Date }>({ table: "customers", where: { notion_id: notionId }, select: { id: true, updated_at: true } });
  if (!row) return;
  const page = (await notion.pages.retrieve({ page_id: notionId })) as any;
  const updatedAt = dayLib(page.last_edited_time);
  if (updatedAt.diff(row.updated_at) <= 0) return;
  const data = mapRecordCustomer(page.properties);
  const duplicate = await database.findFirst<{ notion_id: string }>({ table: "customers", where: { name: data.name, notion_id: { value: notionId, is_not: true } }, select: { notion_id: true } });
  if (duplicate) {
    for (const taskId of data.tasks) await notion.pages.update({ page_id: taskId, properties: { Cliente: { relation: [{ id: duplicate.notion_id }] } } });
    await notion.pages.update({ page_id: notionId, in_trash: true });
    await database.deleteFromTable({ table: "customers", where: { id: row.id } });
  } else {
    await database.updateIntoTable({ table: "customers", dataDict: { name: data.name, data, updated_at: updatedAt.toDate() }, where: { id: row.id } });
  }
}

export async function excludeCustomerDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  const row = await database.findFirst<{ id: number }>({ table: "customers", where: { notion_id: notionId }, select: { id: true } });
  if (row) await database.deleteFromTable({ table: "customers", where: { id: row.id } });
}
