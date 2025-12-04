import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";

export async function updateTaskComment(notion_id: string) {
  const database = await databaseNotionPromise

  const taskCommentData = await database.findFirst<{ id: number, updated_at: Date }>({
    table: "task_comments",
    where: { notion_id },
    select: { id: true, updated_at: true },
  });

  if (taskCommentData) {
    let dataDict = {}
    const result = (await notion.comments.retrieve({ comment_id: notion_id })) as any
    const updated_at = dayLib(result.last_edited_time)
    dataDict = { ...dataDict, data: result, updated_at: updated_at.toDate() }

    if (result.attachments) {
      const attachment = result.attachments[0];
      dataDict = { ...dataDict, expired_at: dayLib(attachment.file.expiry_time).toDate() }
    }

    if (updated_at.diff(taskCommentData.updated_at) > 0) {
      await database.updateIntoTable({ table: "task_comments", dataDict, where: { id: taskCommentData.id } })
    }
  }
}
