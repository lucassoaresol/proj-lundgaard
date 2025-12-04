import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";

export async function createTaskComment(notion_id: string) {
  const database = await databaseNotionPromise

  const taskCommentExists = await database.findFirst({ table: "task_comments", where: { notion_id }, select: { "id": true } })

  if (!taskCommentExists) {
    let dataDict = {}
    const result = (await notion.comments.retrieve({ comment_id: notion_id })) as any
    dataDict = { ...dataDict, notion_id, data: result, updated_at: dayLib(result.last_edited_time).toDate() }

    if (result.attachments) {
      const attachment = result.attachments[0];
      dataDict = { ...dataDict, expired_at: dayLib(attachment.file.expiry_time).toDate() }
    }

    if (result.parent.type === "page_id") {
      const task = await database.findFirst<{ id: number }>({ table: "tasks", where: { notion_id: result.parent.page_id }, select: { id: true } })

      if (task) {
        await database.insertIntoTable({
          table: "task_comments",
          dataDict: { ...dataDict, task_id: task.id }
        });
      }
    }
  }
}
