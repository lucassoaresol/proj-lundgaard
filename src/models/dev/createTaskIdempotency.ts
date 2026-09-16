import { isUniqueViolationOnConstraint } from "../../utils/databaseError";

export const TASKS_NOTION_ID_CONSTRAINT = "tasks_notion_id_key";

type Insert = () => Promise<{ id: number } | void>;
type FindWinner = () => Promise<{ id: number } | null>;

type TaskDevData = {
  customer: string;
  customer_id?: number;
  assignee: string;
  people: string;
  is_editable: boolean;
};

type Customer = { id: number; name: string; notion_id: string };
type Page = {
  properties: Record<string, any>;
  last_edited_time: string;
};

type CreateTaskDevDependencies = {
  findExisting: () => Promise<{ id: number } | null>;
  retrievePage: () => Promise<Page>;
  mapPage: (page: Page) => TaskDevData;
  resolveCustomer: (data: TaskDevData) => Promise<Customer | undefined>;
  insert: (data: TaskDevData, customerId: number | undefined) => Insert;
  findWinner: FindWinner;
  updatePage: (properties: Record<string, any>) => Promise<Page>;
  saveRow: (
    id: number,
    page: Page,
    customerId: number | undefined,
  ) => Promise<unknown>;
  duplicate?: () => void;
};

export async function insertTaskDevIdempotently(
  insert: Insert,
  findWinner: FindWinner,
): Promise<{ id: number; inserted: boolean }> {
  try {
    const row = await insert();
    if (!row) throw new Error("Task insert returned no row");
    return { id: row.id, inserted: true };
  } catch (error) {
    if (!isUniqueViolationOnConstraint(error, TASKS_NOTION_ID_CONSTRAINT)) {
      throw error;
    }
  }

  const winner = await findWinner();
  if (!winner) {
    throw new Error("Expected the winning task row after notion_id conflict");
  }

  return { id: winner.id, inserted: false };
}

function initializationProperties(
  id: number,
  page: Page,
  data: TaskDevData,
  customer: Customer | undefined,
): Record<string, any> {
  const properties: Record<string, any> = {};
  const currentId = page.properties.ID?.number;
  const currentCustomerNotionId = page.properties.Cliente?.relation?.[0]?.id;

  if (currentId !== id) properties.ID = { number: id };
  if (!data.is_editable) properties.Editable = { checkbox: true };
  if (customer && currentCustomerNotionId !== customer.notion_id) {
    properties.Cliente = { relation: [{ id: customer.notion_id }] };
  }
  if (!data.customer && customer) {
    properties.Project = { select: { name: customer.name } };
  }
  if (data.assignee.length < 2 && data.people) {
    properties.Assignee = { select: { name: data.people } };
  }

  return properties;
}

export async function runCreateTaskDev(
  dependencies: CreateTaskDevDependencies,
): Promise<void> {
  const existing = await dependencies.findExisting();
  let page = await dependencies.retrievePage();
  let data = dependencies.mapPage(page);
  const customer = await dependencies.resolveCustomer(data);
  const row = existing
    ? { id: existing.id, inserted: false }
    : await insertTaskDevIdempotently(
        dependencies.insert(data, customer?.id),
        dependencies.findWinner,
      );

  if (!existing && !row.inserted) {
    dependencies.duplicate?.();
    return;
  }

  const properties = initializationProperties(row.id, page, data, customer);
  if (Object.keys(properties).length > 0) {
    page = await dependencies.updatePage(properties);
  }

  await dependencies.saveRow(row.id, page, customer?.id);
}
