import { createCustomerQueue, updateCustomerQueue, excludeCustomerQueue } from "../../worker/services/customer";
import { createTaskQueue, updateTaskQueue, excludeTaskQueue } from "../../worker/services/task";

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
      "2a7d4938-702d-8055-bc7d-000b6bccef16"
    ) {
      await createCustomerQueue.add(
        "save-create-customer",
        body.entity.id,
        { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
      );
    }

    if (
      body.data.parent.data_source_id ===
      "262d4938-702d-808a-bd82-000ba32e2807"
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
      "2a7d4938-702d-8055-bc7d-000b6bccef16"
    ) {
      await updateCustomerQueue.add(
        "save-update-customer",
        body.entity.id,
        { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
      );
    }

    if (
      body.data.parent.data_source_id ===
      "262d4938-702d-808a-bd82-000ba32e2807"
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
      "2a7d4938-702d-8055-bc7d-000b6bccef16"
    ) {
      await excludeCustomerQueue.add(
        "save-exclude-customer",
        body.entity.id,
        { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
      );
    }

    if (
      body.data.parent.data_source_id ===
      "262d4938-702d-808a-bd82-000ba32e2807"
    ) {
      await excludeTaskQueue.add(
        "save-exclude-task",
        body.entity.id,
        { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
      );
    }
  }
}
