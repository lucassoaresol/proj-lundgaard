import databaseNotionPromise from "../../db/notion";
import dayLib from "../../libs/dayjs";
import notion from "../../libs/notion";
import { createTaskQueue, updateTaskAssigneeQueue, updateTaskCustomerQueue } from "../../worker/services/task";
import { mapRecordTask } from "./mapRecord";

export async function updateTask(notion_id: string) {
  const database = await databaseNotionPromise

  const taskData = await database.findFirst<{ id: number, data: any, updated_at: Date }>({
    table: "tasks",
    where: { notion_id },
    select: { id: true, data: true, updated_at: true },
  });

  if (taskData) {
    const result = (await notion.pages.retrieve({ page_id: notion_id })) as any;
    const updated_at = dayLib(result.last_edited_time)
    const data = mapRecordTask(result.properties);

    if (updated_at.diff(taskData.updated_at) > 0) {
      await database.updateIntoTable({ table: "tasks", dataDict: { data, customer_id: data.customer_id, updated_at: updated_at.toDate() }, where: { id: taskData.id } })

      await updateTaskCustomerQueue.add("save-update-task-customer", { notion_id, project: data.customer, customer_id: data.customer_id }, {
        attempts: 1000,
        backoff: { type: "exponential", delay: 5000 },
      });

      if (data.people && data.people !== taskData.data.people) {
        await updateTaskAssigneeQueue.add("save-update-task-assignee", { notion_id, assignee: data.people }, {
          attempts: 1000,
          backoff: { type: "exponential", delay: 5000 },
        });
      }
    }
  } else {
    await createTaskQueue.add("save-create-task", notion_id, {
      attempts: 1000,
      backoff: { type: "exponential", delay: 5000 },
    });
  }
}
