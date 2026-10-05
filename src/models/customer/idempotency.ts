export function customerIdProperty(id: number): { number: number } {
  return { number: id };
}

import { isUniqueViolation } from "../../utils/databaseError";

type Insert = () => Promise<{ id: number } | void>;
type FindWinner = () => Promise<{ id: number } | null>;

export async function insertCustomerIdempotently(
  insert: Insert,
  findWinner: FindWinner,
): Promise<{ id: number; inserted: boolean }> {
  try {
    const row = await insert();
    if (!row) throw new Error("Customer insert returned no row");
    return { id: row.id, inserted: true };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }
  const winner = await findWinner();
  if (!winner)
    throw new Error("Expected the winning customer row after conflict");
  return { id: winner.id, inserted: false };
}
