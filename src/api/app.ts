import FastifyCors from "@fastify/cors";
import Fastify, { FastifyRequest } from "fastify";

import { serverAdapter } from "./bull";
import { receivedNotionCommentWebhook } from "./modules/comment";
import { receivedNotionPageWebhook } from "./modules/page";

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
    if (request.body.type.includes("page")) {
      await receivedNotionPageWebhook(request.body);
    } else if (request.body.type.includes("comment")) {
      await receivedNotionCommentWebhook(request.body);
    }

    reply.send("OK");
  },
);

export default app;
