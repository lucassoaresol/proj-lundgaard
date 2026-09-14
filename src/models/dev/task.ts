import { MONTHS_NAME } from "../../config/const";
import type { NotionCheckboxProp, NotionDateProp, NotionPeopleProp, NotionRichTextProp, NotionRollupProp, NotionSelectProp, NotionStatusProp, NotionTitleProp } from "../../config/types";
import databaseNotionDevPromise from "../../db/dev/notionDev";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { createTaskDevQueue } from "../../queues";
import { getStorageDev } from "../../utils/dev/getStorageDev";
import { joinPlainText } from "../../utils/joinPlainText";
import { CONTROLLED_RETRY_OPTIONS } from "../../worker/retryPolicy";
import { retrieveCustomerDev } from "./customer";

type Properties = {
  Nome?: NotionTitleProp; Project?: NotionSelectProp; DEVIS?: NotionRichTextProp;
  Status?: NotionStatusProp; Notes?: NotionRichTextProp; "Concluído em"?: NotionDateProp;
  Assignee?: NotionSelectProp; Pessoa?: NotionPeopleProp; Team?: NotionSelectProp;
  "Cliente ID"?: NotionRollupProp; Editable?: NotionCheckboxProp;
};

export function mapRecordTaskDev(properties: Properties) {
  return {
    name: (joinPlainText(properties.Nome?.title) ?? "").toUpperCase(),
    customer: properties.Project?.select?.name ?? "",
    devis: joinPlainText(properties.DEVIS?.rich_text) ?? "",
    status: properties.Status?.status?.name ?? "",
    notes: joinPlainText(properties.Notes?.rich_text) ?? "",
    completed_at: properties["Concluído em"]?.date?.start,
    assignee: properties.Assignee?.select?.name ?? "",
    people: properties.Pessoa?.people?.[0]?.name ?? "",
    people_id: properties.Pessoa?.people?.[0]?.id ?? "",
    team: properties.Team?.select?.name ?? "",
    customer_id: properties["Cliente ID"]?.rollup?.array?.[0]?.number,
    is_editable: properties.Editable?.checkbox ?? false,
  };
}

export async function createTaskDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  if (await database.findFirst({ table: "tasks", where: { notion_id: notionId }, select: { id: true } })) return;
  const page = (await notion.pages.retrieve({ page_id: notionId })) as any;
  const data = mapRecordTaskDev(page.properties);
  const customer = await retrieveCustomerDev(data.customer, data.customer_id);
  const inserted = await database.insertIntoTable<{ id: number }>({ table: "tasks", dataDict: { data, customer_id: customer?.id, notion_id: notionId }, select: { id: true } });
  if (!inserted) return;
  const properties: Record<string, unknown> = { Editable: { checkbox: true } };
  if (customer) properties.Cliente = { relation: [{ id: customer.notion_id }] };
  if (!data.customer && customer) properties.Project = { select: { name: customer.name } };
  if (data.assignee.length < 2 && data.people) properties.Assignee = { select: { name: data.people } };
  const updated = (await notion.pages.update({ page_id: notionId, properties: { ID: { number: inserted.id }, ...properties } })) as any;
  await database.updateIntoTable({ table: "tasks", dataDict: { data: mapRecordTaskDev(updated.properties), customer_id: customer?.id, updated_at: dayLib(updated.last_edited_time).toDate() }, where: { id: inserted.id } });
}

export async function updateTaskDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  const row = await database.findFirst<{ id: number; data: any; updated_at: Date }>({ table: "tasks", where: { notion_id: notionId }, select: { id: true, data: true, updated_at: true } });
  if (!row) { await createTaskDevQueue.add("save-create-task-dev", notionId, CONTROLLED_RETRY_OPTIONS); return; }
  const page = (await notion.pages.retrieve({ page_id: notionId })) as any;
  let updatedAt = dayLib(page.last_edited_time); if (updatedAt.diff(row.updated_at) <= 0) return;
  let data = mapRecordTaskDev(page.properties);
  let customer = await retrieveCustomerDev(data.customer, data.customer_id);
  if (customer && data.customer.trim().toUpperCase() !== customer.name) customer = await retrieveCustomerDev(data.customer);
  if (customer && customer.id !== data.customer_id) {
    const updated = (await notion.pages.update({ page_id: notionId, properties: { Cliente: { relation: [{ id: customer.notion_id }] } } })) as any;
    updatedAt = dayLib(updated.last_edited_time); data = mapRecordTaskDev(updated.properties);
  }
  if (data.people && data.people !== row.data.people) {
    const updated = (await notion.pages.update({ page_id: notionId, properties: { Assignee: { select: { name: data.people } } } })) as any;
    updatedAt = dayLib(updated.last_edited_time); data = mapRecordTaskDev(updated.properties);
  }
  if (data.is_editable && data.status === "completed" && data.team === "LUNDGAARD JENSEN ADVOCACIA") {
    if (!data.completed_at) {
      const updated = (await notion.pages.update({ page_id: notionId, properties: { "Concluído em": { date: { start: dayLib().format("YYYY-MM-DD") } } } })) as any;
      updatedAt = dayLib(updated.last_edited_time); data = mapRecordTaskDev(updated.properties);
    }
    const source = await getStorageDev("DATA_SOURCE_COMPLETED_TASK");
    if (source) {
      const completedAt = dayLib(data.completed_at);
      await notion.pages.create({ parent: { data_source_id: source.data }, properties: {
        Nome: { title: [{ text: { content: `${customer?.name} - ${data.name}` } }] },
        Team: { select: { name: "WORK CONCLUSION - ADVOCACIA" } }, Pessoa: { people: [{ id: data.people_id }] },
        "Concluído em": { date: { start: completedAt.format("YYYY-MM-DD") } }, DEVIS: { rich_text: [{ text: { content: data.devis } }] },
        Project: { select: { name: `WORK COMPLETED - ${MONTHS_NAME[completedAt.format("MM")]} ${completedAt.format("YYYY")}` } }, Task: { relation: [{ id: notionId }] },
      } });
    }
  }
  if (data.is_editable && data.status !== "completed" && data.team === "LUNDGAARD JENSEN ADVOCACIA" && row.data.status === "completed") {
    const completed = await database.findFirst<{ id: number; notion_id: string }>({ table: "completed_tasks", where: { task_id: row.id }, select: { id: true, notion_id: true } });
    if (completed) { await notion.pages.update({ page_id: completed.notion_id, in_trash: true }); await database.deleteFromTable({ table: "completed_tasks", where: { id: completed.id } }); }
  }
  await database.updateIntoTable({ table: "tasks", dataDict: { data, customer_id: customer?.id, updated_at: updatedAt.toDate() }, where: { id: row.id } });
}

export async function excludeTaskDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  const row = await database.findFirst<{ id: number }>({ table: "tasks", where: { notion_id: notionId }, select: { id: true } });
  if (row) await database.deleteFromTable({ table: "tasks", where: { id: row.id } });
}
