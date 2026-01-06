import databaseNotionPromise from "../db/notion";

export async function getStorage(identifier: string) {
  const database = await databaseNotionPromise;

  const storage = await database.findFirst<{ data: any }>({
    table: "generic_storages",
    where: { identifier },
    select: { data: true },
  });

  return storage;
}
