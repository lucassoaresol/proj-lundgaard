import { env } from "../../config/env";
import { createCustomerQueue, excludeCustomerQueue, updateCustomerQueue } from "../../worker/services/customer";
import { createTaskQueue, excludeTaskQueue, updateTaskQueue } from "../../worker/services/task";

export async function receivedNotionPageWebhook(body: {
  entity: { id: string };
  type: string;
  data: {
    parent: {
      data_source_id: string;
    };
  };
}) {
  if (
    body.type === "page.created" ||
    body.type === "page.undeleted"
  ) {
    if (
      body.data.parent.data_source_id ===
      env.dataSourceCustomer
    ) {
      await createCustomerQueue.add(
        "save-create-customer",
        body.entity.id,
        { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
      );
    }

    if (
      body.data.parent.data_source_id ===
      env.dataSourceTask
    ) {
      await createTaskQueue.add("save-create-task", body.entity.id, {
        attempts: 1000,
        backoff: { type: "exponential", delay: 5000 },
      });
    }
  }

  if (body.type === "page.properties_updated") {
    if (
      body.data.parent.data_source_id ===
      env.dataSourceCustomer
    ) {
      await updateCustomerQueue.add(
        "save-update-customer",
        body.entity.id,
        { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
      );
    }

    if (
      body.data.parent.data_source_id ===
      env.dataSourceTask
    ) {
      await updateTaskQueue.add("save-update-task", body.entity.id, {
        attempts: 1000,
        backoff: { type: "exponential", delay: 5000 },
      });
    }
  }

  if (body.type === "page.deleted") {
    if (
      body.data.parent.data_source_id ===
      env.dataSourceCustomer
    ) {
      await excludeCustomerQueue.add(
        "save-exclude-customer",
        body.entity.id,
        { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
      );
    }

    if (
      body.data.parent.data_source_id ===
      env.dataSourceTask
    ) {
      await excludeTaskQueue.add(
        "save-exclude-task",
        body.entity.id,
        { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
      );
    }
  }
}
