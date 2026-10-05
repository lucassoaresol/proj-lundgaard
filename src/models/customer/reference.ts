export type CustomerReference = { id: number; name: string; notion_id: string };

export type CustomerResolver = {
  findByNotionId?: (
    notionId: string,
  ) => Promise<CustomerReference | null | undefined>;
  findById(id: number): Promise<CustomerReference | null | undefined>;
  findByName(name: string): Promise<CustomerReference | null | undefined>;
  createByName(name: string): Promise<CustomerReference | undefined>;
};

export function normalizeCustomerId(id: unknown): number | undefined {
  const value = typeof id === "number" ? id : Number(id);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

export function normalizeCustomerName(name: unknown): string {
  return typeof name === "string" ? name.trim().toUpperCase() : "";
}

export async function resolveCustomerReference(
  name: unknown,
  id: unknown,
  resolver: CustomerResolver,
  notionId?: unknown,
): Promise<CustomerReference | undefined> {
  if (typeof notionId === "string" && notionId.length > 0) {
    // A live relation is authoritative. Never create a different customer by name
    // when that relation is not present in the local database.
    return (await resolver.findByNotionId?.(notionId)) ?? undefined;
  }

  const normalizedId = normalizeCustomerId(id);
  if (normalizedId) {
    const byId = await resolver.findById(normalizedId);
    if (byId) return byId;
  }

  const normalizedName = normalizeCustomerName(name);
  if (normalizedName.length <= 2) return undefined;

  const byName = await resolver.findByName(normalizedName);
  return byName ?? resolver.createByName(normalizedName);
}
