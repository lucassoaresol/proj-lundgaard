export const CUSTOMER_RECONCILIATION_KEY = "_customer_reconciliation";
export const CUSTOMER_QUEUE_BATCH_LIMIT = 100;
export const CUSTOMER_PROBE_BATCH_LIMIT = 25;
export const CUSTOMER_RECONCILIATION_COOLDOWN_DAYS = 30;

export type CustomerReferenceData = {
  customer?: unknown;
  customer_id?: unknown;
  [CUSTOMER_RECONCILIATION_KEY]?: CustomerReconciliationMarker;
  [key: string]: unknown;
};

export type CustomerReconciliationMarker = {
  status:
    | "no_customer_reference"
    | "unresolved_reference"
    | "notion_inaccessible"
    | "transient_failure"
    | "permanent_failure";
  next_retry_at: string;
};

export type CustomerReconciliationTask = {
  id: number;
  notion_id: string;
  data: unknown;
};

export type CustomerReconciliationSelection = {
  direct: CustomerReconciliationTask[];
  probes: CustomerReconciliationTask[];
};

export type TaskDataCompareAndSet = {
  dataDict: { data: unknown };
  where: {
    id: number;
    data: { value: unknown } | null;
  };
};

function asTaskData(data: unknown): CustomerReferenceData {
  return data !== null && typeof data === "object"
    ? (data as CustomerReferenceData)
    : {};
}

function hasCustomerName(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 2;
}

function hasCustomerId(value: unknown): boolean {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number > 0;
}

function normalizedCustomerReference(data: unknown): {
  customer: string;
  customerId?: number;
} {
  const taskData = asTaskData(data);
  return {
    customer:
      typeof taskData.customer === "string"
        ? taskData.customer.trim().toUpperCase()
        : "",
    customerId: hasCustomerId(taskData.customer_id)
      ? Number(taskData.customer_id)
      : undefined,
  };
}

export function customerReferenceChanged(
  previousData: unknown,
  nextData: unknown,
): boolean {
  const previous = normalizedCustomerReference(previousData);
  const next = normalizedCustomerReference(nextData);
  return (
    previous.customer !== next.customer ||
    previous.customerId !== next.customerId
  );
}

export function customerReferenceMatches(
  data: unknown,
  project: unknown,
  customerId: unknown,
): boolean {
  return !customerReferenceChanged(data, {
    customer: project,
    customer_id: customerId,
  });
}

export function mergeCustomerReconciliationState(
  previousData: unknown,
  nextData: unknown,
): CustomerReferenceData {
  const next = asTaskData(nextData);
  const marker = asTaskData(previousData)[CUSTOMER_RECONCILIATION_KEY];

  if (!marker || customerReferenceChanged(previousData, nextData)) return next;
  return { ...next, [CUSTOMER_RECONCILIATION_KEY]: marker };
}

export function shouldQueueCustomerReconciliation(
  previousData: unknown,
  nextData: unknown,
  now = new Date(),
): boolean {
  if (customerReferenceChanged(previousData, nextData)) return true;
  const marker = asTaskData(previousData)[CUSTOMER_RECONCILIATION_KEY];
  return !marker || isReconciliationDue(previousData, now);
}

export function hasUsableCustomerReference(data: unknown): boolean {
  const taskData = asTaskData(data);
  return (
    hasCustomerName(taskData.customer) || hasCustomerId(taskData.customer_id)
  );
}

export function isNotionInaccessibleErrorClass(errorClass: string): boolean {
  return (
    errorClass === "NOTION_OBJECT_NOT_FOUND" ||
    errorClass === "NOTION_AUTHORIZATION"
  );
}

export function customerJobData(task: CustomerReconciliationTask) {
  const data = asTaskData(task.data);
  return {
    notion_id: task.notion_id,
    project: hasCustomerName(data.customer) ? String(data.customer).trim() : "",
    customer_id: hasCustomerId(data.customer_id)
      ? Number(data.customer_id)
      : undefined,
  };
}

export function isReconciliationDue(data: unknown, now: Date): boolean {
  const marker = asTaskData(data)[CUSTOMER_RECONCILIATION_KEY];
  if (!marker || typeof marker.next_retry_at !== "string") return true;

  const nextRetry = new Date(marker.next_retry_at);
  return Number.isNaN(nextRetry.getTime()) || nextRetry <= now;
}

export function selectCustomerReconciliationBatch(
  tasks: CustomerReconciliationTask[],
  now: Date,
  queueLimit = CUSTOMER_QUEUE_BATCH_LIMIT,
  probeLimit = CUSTOMER_PROBE_BATCH_LIMIT,
): CustomerReconciliationSelection {
  const due = tasks.filter((task) => isReconciliationDue(task.data, now));
  const prioritized = [
    ...due.filter(
      (task) => !asTaskData(task.data)[CUSTOMER_RECONCILIATION_KEY],
    ),
    ...due.filter((task) => asTaskData(task.data)[CUSTOMER_RECONCILIATION_KEY]),
  ];

  return {
    direct: prioritized
      .filter((task) => hasUsableCustomerReference(task.data))
      .slice(0, queueLimit),
    probes: prioritized
      .filter((task) => !hasUsableCustomerReference(task.data))
      .slice(0, probeLimit),
  };
}

export function withCustomerReconciliationMarker(
  data: unknown,
  status: CustomerReconciliationMarker["status"],
  now: Date,
  cooldownDays = CUSTOMER_RECONCILIATION_COOLDOWN_DAYS,
): CustomerReferenceData {
  const nextRetry = new Date(now);
  nextRetry.setUTCDate(nextRetry.getUTCDate() + cooldownDays);

  return {
    ...asTaskData(data),
    [CUSTOMER_RECONCILIATION_KEY]: {
      status,
      next_retry_at: nextRetry.toISOString(),
    },
  };
}

export function compareAndSetTaskData(
  taskId: number,
  expectedData: unknown,
  nextData: unknown,
): TaskDataCompareAndSet {
  return {
    dataDict: { data: nextData },
    where: {
      id: taskId,
      data:
        expectedData === undefined || expectedData === null
          ? null
          : { value: expectedData },
    },
  };
}

export function compareAndSetCustomerReconciliationMarker(
  taskId: number,
  expectedData: unknown,
  status: CustomerReconciliationMarker["status"],
  now: Date,
  cooldownDays = CUSTOMER_RECONCILIATION_COOLDOWN_DAYS,
): TaskDataCompareAndSet {
  return compareAndSetTaskData(
    taskId,
    expectedData,
    withCustomerReconciliationMarker(expectedData, status, now, cooldownDays),
  );
}
