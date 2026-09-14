import databaseNotionDevPromise from "../../db/dev/notionDev";

export async function getStorageDev(identifier: string) {
  const database = await databaseNotionDevPromise;
  return database.findFirst<{ id: number; data: string }>({
    table: "generic_storages",
    where: { identifier },
    select: { id: true, data: true },
  });
}
