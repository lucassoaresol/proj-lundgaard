import databaseNotionPromise from "../../db/notion";

export async function excludeYear(notion_id: string) {
  const database = await databaseNotionPromise;

  const year = await database.findFirst<{ id: number }>({
    table: "years",
    where: { notion_id },
    select: { id: true },
  });

  if (year) {
    await database.deleteFromTable({
      table: "years",
      where: { id: year.id },
    });
  }
}

