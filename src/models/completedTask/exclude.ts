import databaseNotionPromise from "../../db/notion";

export async function excludeCompletedTask(notion_id: string) {
  const database = await databaseNotionPromise;

  const completedTask = await database.findFirst<{ id: number }>({
    table: "completed_tasks",
    where: { notion_id },
    select: { id: true },
  });

  if (completedTask) {
    await database.deleteFromTable({
      table: "completed_tasks",
      where: { id: completedTask.id },
    });
  }
}

