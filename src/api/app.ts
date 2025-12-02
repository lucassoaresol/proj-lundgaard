import FastifyCors from "@fastify/cors";
import Fastify, { FastifyRequest } from "fastify";

import {
  createCustomerQueue,
  excludeCustomerQueue,
  updateCustomerQueue,
} from "../worker/services/customer";
import {
  createTaskQueue,
  excludeTaskQueue,
  updateTaskQueue,
} from "../worker/services/task";

import { serverAdapter } from "./bull";

const app = Fastify();

app.register(FastifyCors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});
app.register(serverAdapter.registerPlugin(), {
  prefix: "/admin/queues",
});

app.post(
  "/notion",
  async (
    request: FastifyRequest<{
      Body: {
        entity: { id: string };
        type: string;
        data: {
          parent: {
            data_source_id: string;
          };
        };
      };
    }>,
    reply,
  ) => {
    if (
      request.body.type === "page.created" ||
      request.body.type === "page.undeleted"
    ) {
      if (
        request.body.data.parent.data_source_id ===
        "2a7d4938-702d-8055-bc7d-000b6bccef16"
      ) {
        await createCustomerQueue.add(
          "save-create-customer",
          request.body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }

      if (
        request.body.data.parent.data_source_id ===
        "262d4938-702d-808a-bd82-000ba32e2807"
      ) {
        await createTaskQueue.add("save-create-task", request.body.entity.id, {
          attempts: 1000,
          backoff: { type: "exponential", delay: 5000 },
        });
      }
    }

    if (request.body.type === "page.properties_updated") {
      if (
        request.body.data.parent.data_source_id ===
        "2a7d4938-702d-8055-bc7d-000b6bccef16"
      ) {
        await updateCustomerQueue.add(
          "save-update-customer",
          request.body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }

      if (
        request.body.data.parent.data_source_id ===
        "262d4938-702d-808a-bd82-000ba32e2807"
      ) {
        await updateTaskQueue.add("save-update-task", request.body.entity.id, {
          attempts: 1000,
          backoff: { type: "exponential", delay: 5000 },
        });
      }
    }

    if (request.body.type === "page.deleted") {
      if (
        request.body.data.parent.data_source_id ===
        "2a7d4938-702d-8055-bc7d-000b6bccef16"
      ) {
        await excludeCustomerQueue.add(
          "save-exclude-customer",
          request.body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }

      if (
        request.body.data.parent.data_source_id ===
        "262d4938-702d-808a-bd82-000ba32e2807"
      ) {
        await excludeTaskQueue.add(
          "save-exclude-task",
          request.body.entity.id,
          { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
        );
      }
    }

    reply.send("OK");
  },
);

export default app;
