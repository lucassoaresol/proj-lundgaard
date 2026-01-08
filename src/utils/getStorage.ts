import databaseNotionPromise from "../db/notion";

export async function getStorage(identifier: string) {
  const database = await databaseNotionPromise;

  const storage = await database.findFirst<{ id: number; data: any }>({
    table: "generic_storages",
    where: { identifier },
    select: { id: true, data: true },
  });

  return storage;
}
