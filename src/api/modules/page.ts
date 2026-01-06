import { getStorage } from "../../utils/getStorage";
import { createCustomerQueue, excludeCustomerQueue, updateCustomerQueue } from "../../worker/services/customer";
import { createTaskQueue, excludeTaskQueue, updateTaskQueue } from "../../worker/services/task";
import { createYearQueue, excludeYearQueue, updateYearQueue } from "../../worker/services/year";

export async function receivedNotionPageWebhook(body: {
  entity: { id: string };
  type: string;
  data: {
    parent: {
      data_source_id: string;
    };
  };
}) {
  const [dataSourceCustomer, dataSourceTask, dataSourceYear] = await Promise.all([getStorage("DATA_SOURCE_CUSTOMER"), getStorage("DATA_SOURCE_TASK"), getStorage("DATA_SOURCE_YEAR")])

  if (dataSourceCustomer && dataSourceTask && dataSourceYear) {
    if (
      body.type === "page.created" ||
      body.type === "page.undeleted"
    ) {
      if (
        body.data.parent.data_source_id ===
        dataSourceCustomer.data
      ) {
        await createCustomerQueue.add(
          "save-create-customer",
          body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }

      if (
        body.data.parent.data_source_id ===
        dataSourceTask.data
      ) {
        await createTaskQueue.add("save-create-task", body.entity.id, {
          attempts: 1000,
          backoff: { type: "exponential", delay: 5000 },
        });
      }

      if (
        body.data.parent.data_source_id ===
        dataSourceYear.data
      ) {
        await createYearQueue.add("save-create-year", body.entity.id, {
          attempts: 1000,
          backoff: { type: "exponential", delay: 5000 },
        });
      }
    }

    if (body.type === "page.properties_updated") {
      if (
        body.data.parent.data_source_id ===
        dataSourceCustomer.data
      ) {
        await updateCustomerQueue.add(
          "save-update-customer",
          body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }

      if (
        body.data.parent.data_source_id ===
        dataSourceTask.data
      ) {
        await updateTaskQueue.add("save-update-task", body.entity.id, {
          attempts: 1000,
          backoff: { type: "exponential", delay: 5000 },
        });
      }

      if (
        body.data.parent.data_source_id ===
        dataSourceYear.data
      ) {
        await updateYearQueue.add(
          "save-update-year",
          body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }
    }

    if (body.type === "page.deleted") {
      if (
        body.data.parent.data_source_id ===
        dataSourceCustomer.data
      ) {
        await excludeCustomerQueue.add(
          "save-exclude-customer",
          body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }

      if (
        body.data.parent.data_source_id ===
        dataSourceTask.data
      ) {
        await excludeTaskQueue.add(
          "save-exclude-task",
          body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }

      if (
        body.data.parent.data_source_id ===
        dataSourceYear.data
      ) {
        await excludeYearQueue.add(
          "save-exclude-year",
          body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }
    }
  }
}
