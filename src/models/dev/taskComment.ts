import databaseNotionDevPromise from "../../db/dev/notionDev";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { isUniqueViolation } from "../../utils/databaseError";

export async function createTaskCommentDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  if (await database.findFirst({ table: "task_comments", where: { notion_id: notionId }, select: { id: true } })) return;
  const result = (await notion.comments.retrieve({ comment_id: notionId })) as any;
  let dataDict: Record<string, unknown> = { notion_id: notionId, data: result, updated_at: dayLib(result.last_edited_time).toDate() };
  if (result.attachments?.[0]) dataDict = { ...dataDict, expired_at: dayLib(result.attachments[0].file.expiry_time).toDate() };
  if (result.parent.type !== "page_id") return;
  const task = await database.findFirst<{ id: number }>({ table: "tasks", where: { notion_id: result.parent.page_id }, select: { id: true } });
  if (!task) return;
  try { await database.insertIntoTable({ table: "task_comments", dataDict: { ...dataDict, task_id: task.id } }); }
  catch (error) { if (!isUniqueViolation(error)) throw error; }
}

export async function updateTaskCommentDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  const row = await database.findFirst<{ id: number; updated_at: Date }>({ table: "task_comments", where: { notion_id: notionId }, select: { id: true, updated_at: true } });
  if (!row) return;
  const result = (await notion.comments.retrieve({ comment_id: notionId })) as any;
  const updatedAt = dayLib(result.last_edited_time); if (updatedAt.diff(row.updated_at) <= 0) return;
  let dataDict: Record<string, unknown> = { data: result, updated_at: updatedAt.toDate() };
  if (result.attachments?.[0]) dataDict = { ...dataDict, expired_at: dayLib(result.attachments[0].file.expiry_time).toDate() };
  await database.updateIntoTable({ table: "task_comments", dataDict, where: { id: row.id } });
}

export async function excludeTaskCommentDev(notionId: string) {
  const database = await databaseNotionDevPromise;
  const row = await database.findFirst<{ id: number }>({ table: "task_comments", where: { notion_id: notionId }, select: { id: true } });
  if (row) await database.deleteFromTable({ table: "task_comments", where: { id: row.id } });
}
