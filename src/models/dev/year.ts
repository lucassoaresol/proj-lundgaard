import databaseNotionDevPromise from "../../db/dev/notionDev";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { getStorageDev } from "../../utils/dev/getStorageDev";
import { mapRecordYear } from "../year/mapRecord";

export async function retrieveYearDev(year: string, id?: number) {
  const [source, template] = await Promise.all([getStorageDev("DATA_SOURCE_YEAR"), getStorageDev("TEMPLATE_YEAR")]);
  if (!source || !template) return;
  const database = await databaseNotionDevPromise;
  if (id) return database.findFirst<{ id: number; year: string; notion_id: string }>({ table: "years", where: { id }, select: { id: true, year: true, notion_id: true } });
  if (!year || year.length <= 2) return;
  const existing = await database.findFirst<{ id: number; year: string; notion_id: string }>({ table: "years", where: { year }, select: { id: true, year: true, notion_id: true } });
  if (existing) return existing;
  const page = (await notion.pages.create({ parent: { data_source_id: source.data }, properties: { Year: { title: [{ text: { content: year } }] } }, template: { type: "template_id", template_id: template.data } })) as any;
  const data = mapRecordYear(page.properties);
  const inserted = await database.insertIntoTable<{ id: number }>({ table: "years", dataDict: { year: data.year, data, notion_id: page.id }, select: { id: true } });
  if (!inserted) return;
  const updated = (await notion.pages.update({ page_id: page.id, properties: { ID: { number: inserted.id } } })) as any;
  await database.updateIntoTable({ table: "years", dataDict: { updated_at: new Date(updated.last_edited_time) }, where: { id: inserted.id } });
  return { id: inserted.id, year: data.year, notion_id: page.id };
}

export async function createYearDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  if (await database.findFirst({ table: "years", where: { notion_id: notionId }, select: { id: true } })) return;
  const page = (await notion.pages.retrieve({ page_id: notionId })) as any;
  const data = mapRecordYear(page.properties);
  if (await database.findFirst({ table: "years", where: { year: data.year }, select: { id: true } })) {
    await notion.pages.update({ page_id: notionId, in_trash: true }); return;
  }
  const inserted = await database.insertIntoTable<{ id: number }>({ table: "years", dataDict: { year: data.year, data, notion_id: notionId }, select: { id: true } });
  if (inserted) {
    const updated = (await notion.pages.update({ page_id: notionId, properties: { ID: { number: inserted.id } } })) as any;
    await database.updateIntoTable({ table: "years", dataDict: { updated_at: dayLib(updated.last_edited_time).toDate() }, where: { id: inserted.id } });
  }
}

export async function updateYearDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  const row = await database.findFirst<{ id: number; updated_at: Date }>({ table: "years", where: { notion_id: notionId }, select: { id: true, updated_at: true } });
  if (!row) return;
  const page = (await notion.pages.retrieve({ page_id: notionId })) as any;
  const updatedAt = dayLib(page.last_edited_time); if (updatedAt.diff(row.updated_at) <= 0) return;
  const data = mapRecordYear(page.properties);
  const duplicate = await database.findFirst({ table: "years", where: { year: data.year }, select: { notion_id: true } });
  if (duplicate) { await notion.pages.update({ page_id: notionId, in_trash: true }); await database.deleteFromTable({ table: "years", where: { id: row.id } }); }
  else await database.updateIntoTable({ table: "years", dataDict: { year: data.year, data, updated_at: updatedAt.toDate() }, where: { id: row.id } });
}

export async function excludeYearDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  const row = await database.findFirst<{ id: number }>({ table: "years", where: { notion_id: notionId }, select: { id: true } });
  if (row) await database.deleteFromTable({ table: "years", where: { id: row.id } });
}
