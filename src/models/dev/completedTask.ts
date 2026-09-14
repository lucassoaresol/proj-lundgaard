import { MONTHS_NUM } from "../../config/const";
import type { NotionDateProp, NotionPeopleProp, NotionRichTextProp, NotionRollupProp, NotionSelectProp, NotionStatusProp, NotionTitleProp } from "../../config/types";
import databaseNotionDevPromise from "../../db/dev/notionDev";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { createCompletedTaskDevQueue } from "../../queues";
import { joinPlainText } from "../../utils/joinPlainText";
import { CONTROLLED_RETRY_OPTIONS } from "../../worker/retryPolicy";
import { retrieveYearDev } from "./year";

type Properties = {
  Nome?: NotionTitleProp; Project?: NotionSelectProp; DEVIS?: NotionRichTextProp;
  State?: NotionStatusProp; Notes?: NotionRichTextProp; "Concluído em"?: NotionDateProp;
  Assignee?: NotionSelectProp; Pessoa?: NotionPeopleProp; Team?: NotionSelectProp;
  Month?: NotionSelectProp; "Year ID"?: NotionRollupProp; "Task ID"?: NotionRollupProp;
};

export function mapRecordCompletedTaskDev(properties: Properties) {
  return {
    name: (joinPlainText(properties.Nome?.title) ?? "").toUpperCase(),
    completion_dates: properties.Project?.select?.name ?? "",
    devis: joinPlainText(properties.DEVIS?.rich_text) ?? "",
    status: properties.State?.status?.name ?? "",
    notes: joinPlainText(properties.Notes?.rich_text) ?? "",
    completed_at: properties["Concluído em"]?.date?.start ?? "",
    assignee: properties.Assignee?.select?.name ?? "",
    people: properties.Pessoa?.people?.[0]?.name,
    team: properties.Team?.select?.name ?? "",
    month: properties.Month?.select?.name ?? "",
    year_id: properties["Year ID"]?.rollup?.array?.[0]?.number,
    task_id: properties["Task ID"]?.rollup?.array?.[0]?.number,
  };
}

export async function createCompletedTaskDev(notionId: string, dataSourceId: number) {
  const database = await databaseNotionDevPromise;
  if (await database.findFirst({ table: "completed_tasks", where: { notion_id: notionId }, select: { id: true } })) return;
  const page = (await notion.pages.retrieve({ page_id: notionId })) as any;
  const data = mapRecordCompletedTaskDev(page.properties);
  const year = await retrieveYearDev(data.completion_dates.match(/\d+/)?.[0] ?? "", data.year_id);
  const inserted = await database.insertIntoTable<{ id: number }>({
    table: "completed_tasks",
    dataDict: { data, year_id: year?.id, task_id: data.task_id, data_source_id: dataSourceId, notion_id: notionId },
    select: { id: true },
  });
  if (!inserted) return;
  let properties: Record<string, unknown> = {};
  const dataDict: Record<string, unknown> = {};
  if (year) { properties.Year = { relation: [{ id: year.notion_id }] }; dataDict.year_id = year.id; }
  if (!data.month && data.completion_dates.length > 2) {
    const month = data.completion_dates.split(" - ")[1].split(" ")[0];
    properties.Month = { select: { name: MONTHS_NUM[month.toUpperCase()] } };
  }
  if (data.assignee.length < 2 && data.people) properties.Assignee = { select: { name: data.people } };
  const updated = (await notion.pages.update({ page_id: notionId, properties: { ID: { number: inserted.id }, ...properties } })) as any;
  if (Object.keys(properties).length) dataDict.data = mapRecordCompletedTaskDev(updated.properties);
  await database.updateIntoTable({ table: "completed_tasks", dataDict: { updated_at: dayLib(updated.last_edited_time).toDate(), ...dataDict }, where: { id: inserted.id } });
}

export async function updateCompletedTaskDev(notionId: string, dataSourceId: number) {
  const database = await databaseNotionDevPromise;
  const row = await database.findFirst<{ id: number; data: any; updated_at: Date }>({ table: "completed_tasks", where: { notion_id: notionId }, select: { id: true, data: true, updated_at: true } });
  if (!row) {
    await createCompletedTaskDevQueue.add("save-create-completed-task-dev", { notion_id: notionId, data_source_id: dataSourceId }, CONTROLLED_RETRY_OPTIONS);
    return;
  }
  const page = (await notion.pages.retrieve({ page_id: notionId })) as any;
  let updatedAt = dayLib(page.last_edited_time); if (updatedAt.diff(row.updated_at) <= 0) return;
  let data = mapRecordCompletedTaskDev(page.properties);
  let year = await retrieveYearDev(data.completion_dates.match(/\d+/)?.[0] ?? "", data.year_id);
  if (!data.year_id && year || year && data.completion_dates.match(/\d+/)?.[0] !== year.year) {
    if (data.year_id) year = await retrieveYearDev(data.completion_dates.match(/\d+/)?.[0] ?? "");
    if (year) {
      const updated = (await notion.pages.update({ page_id: notionId, properties: { Year: { relation: [{ id: year.notion_id }] } } })) as any;
      updatedAt = dayLib(updated.last_edited_time); data = mapRecordCompletedTaskDev(updated.properties);
    }
  }
  if (data.people && data.people !== row.data.people) {
    const updated = (await notion.pages.update({ page_id: notionId, properties: { Assignee: { select: { name: data.people } } } })) as any;
    updatedAt = dayLib(updated.last_edited_time); data = mapRecordCompletedTaskDev(updated.properties);
  }
  if (!data.month && data.completion_dates.length > 2) {
    const month = data.completion_dates.split(" - ")[1].split(" ")[0];
    const updated = (await notion.pages.update({ page_id: notionId, properties: { Month: { select: { name: MONTHS_NUM[month.toUpperCase()] } } } })) as any;
    updatedAt = dayLib(updated.last_edited_time); data = mapRecordCompletedTaskDev(updated.properties);
  }
  await database.updateIntoTable({ table: "completed_tasks", dataDict: { data, year_id: year?.id ?? data.year_id, task_id: data.task_id, updated_at: updatedAt.toDate() }, where: { id: row.id } });
}

export async function excludeCompletedTaskDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  const row = await database.findFirst<{ id: number }>({ table: "completed_tasks", where: { notion_id: notionId }, select: { id: true } });
  if (row) await database.deleteFromTable({ table: "completed_tasks", where: { id: row.id } });
}
