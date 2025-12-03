import databaseNotionPromise from "../../db/notion";

export async function excludeTaskComment(notion_id: string) {
  const database = await databaseNotionPromise;

  const taskComment = await database.findFirst<{ id: number }>({
    table: "task_comments",
    where: { notion_id },
    select: { id: true },
  });

  if (taskComment) {
    await database.deleteFromTable({
      table: "task_comments",
      where: { id: taskComment.id },
    });
  }
}

