import {
  createCompletedTaskDevQueue, updateCompletedTaskDevQueue, excludeCompletedTaskDevQueue,
  createCustomerDevQueue, updateCustomerDevQueue, excludeCustomerDevQueue,
  createTaskDevQueue, updateTaskDevQueue, excludeTaskDevQueue,
  createYearDevQueue, updateYearDevQueue, excludeYearDevQueue,
} from "../../../queues";
import { getStorageDev } from "../../../utils/dev/getStorageDev";
import { CONTROLLED_RETRY_OPTIONS } from "../../../worker/retryPolicy";
import type { NotionWebhookBody } from "../../createApp";

export async function receivedNotionPageDevWebhook(body: NotionWebhookBody) {
  const [customer, task, year, completedTask] = await Promise.all([
    getStorageDev("DATA_SOURCE_CUSTOMER"), getStorageDev("DATA_SOURCE_TASK"),
    getStorageDev("DATA_SOURCE_YEAR"), getStorageDev("DATA_SOURCE_COMPLETED_TASK"),
  ]);
  if (!customer || !task || !year || !completedTask) return;

  const sourceId = body.data.parent.data_source_id;
  const queues = body.type === "page.created" || body.type === "page.undeleted"
    ? [createCustomerDevQueue, createTaskDevQueue, createYearDevQueue, createCompletedTaskDevQueue]
    : body.type === "page.properties_updated"
      ? [updateCustomerDevQueue, updateTaskDevQueue, updateYearDevQueue, updateCompletedTaskDevQueue]
      : body.type === "page.deleted"
        ? [excludeCustomerDevQueue, excludeTaskDevQueue, excludeYearDevQueue, excludeCompletedTaskDevQueue]
        : undefined;
  if (!queues) return;

  const sources = [customer, task, year, completedTask];
  const index = sources.findIndex((source) => source.data === sourceId);
  if (index < 0) return;
  const action = body.type === "page.properties_updated" ? "update" : body.type === "page.deleted" ? "exclude" : "create";
  const entity = ["customer", "task", "year", "completed-task"][index];
  const data = index === 3 && action !== "exclude"
    ? { notion_id: body.entity.id, data_source_id: completedTask.id }
    : body.entity.id;
  await queues[index].add(`save-${action}-${entity}-dev`, data as never, CONTROLLED_RETRY_OPTIONS);
}
