import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";

export async function createTaskComment(notion_id: string) {
  const database = await databaseNotionPromise

  const taskCommentExists = await database.findFirst({ table: "task_comments", where: { notion_id }, select: { "id": true } })

  if (!taskCommentExists) {
    const result = (await notion.comments.retrieve({ comment_id: notion_id })) as any

    if (result.parent.type === "page_id") {
      const task = await database.findFirst<{ id: number }>({ table: "tasks", where: { notion_id: result.parent.page_id }, select: { id: true } })

      if (task) {
        await database.insertIntoTable({
          table: "task_comments",
          dataDict: { notion_id, task_id: task.id, data: result, updated_at: dayLib(result.last_edited_time).toDate() }
        });
      }
    }
  }
}
