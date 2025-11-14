import FastifyCors from "@fastify/cors";
import Fastify, { FastifyRequest } from "fastify";

const app = Fastify();

app.register(FastifyCors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
    console.log(request.body);

    reply.send("OK");
  },
);

export default app;
