import { customerReferenceMatches } from "./customerReconciliation";

export type CustomerJobTask = {
  id: number;
  customer_id: number | null;
  data: unknown;
};

type Dependencies<Customer> = {
  project: string;
  customerId: unknown;
  loadTask: () => Promise<CustomerJobTask | null>;
  resolveCustomer: () => Promise<Customer | undefined>;
  onStale: () => void;
};

export async function resolveCurrentCustomerJob<Customer>(
  dependencies: Dependencies<Customer>,
): Promise<
  { task: CustomerJobTask; customer: Customer | undefined } | undefined
> {
  const initialTask = await dependencies.loadTask();
  if (!initialTask) return undefined;

  if (
    !customerReferenceMatches(
      initialTask.data,
      dependencies.project,
      dependencies.customerId,
    )
  ) {
    dependencies.onStale();
    return undefined;
  }

  const customer = await dependencies.resolveCustomer();
  const currentTask = await dependencies.loadTask();
  if (!currentTask) return undefined;

  if (
    !customerReferenceMatches(
      currentTask.data,
      dependencies.project,
      dependencies.customerId,
    )
  ) {
    dependencies.onStale();
    return undefined;
  }

  return { task: currentTask, customer };
}
