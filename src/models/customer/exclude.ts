import databaseNotionPromise from "../../db/notion";

export async function excludeCustomer(notion_id: string) {
  const database = await databaseNotionPromise;

  const customer = await database.findFirst<{ id: number }>({
    table: "customers",
    where: { notion_id },
    select: { id: true },
  });

  if (customer) {
    await database.deleteFromTable({
      table: "customers",
      where: { id: customer.id },
    });
  }
}

