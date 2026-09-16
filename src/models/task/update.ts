import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import {
  createTaskQueue,
  updateTaskAssigneeQueue,
  updateTaskCustomerQueue,
} from "../../queues";
import { CONTROLLED_RETRY_OPTIONS } from "../../worker/retryPolicy";

import {
  mergeCustomerReconciliationState,
  shouldQueueCustomerReconciliation,
} from "./customerReconciliation";
import { mapRecordTask } from "./mapRecord";

export async function updateTask(notion_id: string) {
  const database = await databaseNotionPromise;

  const taskData = await database.findFirst<{
    id: number;
    data: any;
    updated_at: Date;
  }>({
    table: "tasks",
    where: { notion_id },
    select: { id: true, data: true, updated_at: true },
  });

  if (taskData) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;
    const updated_at = dayLib(result.last_edited_time);
    const mappedData = mapRecordTask(result.properties);

    if (updated_at.diff(taskData.updated_at) > 0) {
      const data = mergeCustomerReconciliationState(taskData.data, mappedData);
      // The Notion rollup contains a copy of a local customer PK. It can be
      // stale, so only updateTaskCustomer may persist a resolved customer_id.
      await database.updateIntoTable({
        table: "tasks",
        dataDict: { data, updated_at: updated_at.toDate() },
        where: { id: taskData.id },
      });

      if (shouldQueueCustomerReconciliation(taskData.data, mappedData)) {
        await updateTaskCustomerQueue.add(
          "save-update-task-customer",
          {
            notion_id,
            project: mappedData.customer,
            customer_id: mappedData.customer_id,
          },
          CONTROLLED_RETRY_OPTIONS,
        );
      }

      if (mappedData.people && mappedData.people !== taskData.data.people) {
        await updateTaskAssigneeQueue.add(
          "save-update-task-assignee",
          { notion_id, assignee: mappedData.people },
          CONTROLLED_RETRY_OPTIONS,
        );
      }
    }
  } else {
    await createTaskQueue.add(
      "save-create-task",
      notion_id,
      CONTROLLED_RETRY_OPTIONS,
    );
  }
}
