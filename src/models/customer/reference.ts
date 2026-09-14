export type CustomerReference = { id: number; name: string; notion_id: string };

export type CustomerResolver = {
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
): Promise<CustomerReference | undefined> {
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
