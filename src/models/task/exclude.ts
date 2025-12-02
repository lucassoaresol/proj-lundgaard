import databaseNotionPromise from "../../db/notion";

export async function excludeTask(notion_id: string) {
  const database = await databaseNotionPromise;

  const task = await database.findFirst<{ id: number }>({
    table: "tasks",
    where: { notion_id },
    select: { id: true },
  });

  if (task) {
    await database.deleteFromTable({
      table: "tasks",
      where: { id: task.id },
    });
  }
}

