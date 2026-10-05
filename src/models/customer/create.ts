import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";

import { customerIdProperty, insertCustomerIdempotently } from "./idempotency";
import { mapRecordCustomer } from "./mapRecord";

export async function createCustomer(notion_id: string) {
  const database = await databaseNotionPromise;
  const existing = await database.findFirst({
    table: "customers",
    where: { notion_id },
    select: { id: true },
  });
  if (existing) return;

  const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;
  const data = mapRecordCustomer(result.properties);
  const existingByName = await database.findFirst({
    table: "customers",
    where: { name: data.name },
    select: { id: true },
  });
  if (existingByName) {
    await notion.pages.update({ page_id: notion_id, in_trash: true });
    return;
  }

  const inserted = await insertCustomerIdempotently(
    () =>
      database.insertIntoTable<{ id: number }>({
        table: "customers",
        dataDict: { name: data.name, data, notion_id },
        select: { id: true },
      }),
    async () =>
      (await database.findFirst({
        table: "customers",
        where: { notion_id },
        select: { id: true },
      })) ||
      database.findFirst({
        table: "customers",
        where: { name: data.name },
        select: { id: true },
      }),
  );

  if (!inserted.inserted) return;
  const updateCustomer = (await notion.pages.update({
    page_id: notion_id,
    properties: { ID: customerIdProperty(inserted.id) },
  })) as any;
  await database.updateIntoTable({
    table: "customers",
    dataDict: {
      updated_at: dayLib(updateCustomer.last_edited_time).toDate(),
    },
    where: { id: inserted.id },
  });
}
