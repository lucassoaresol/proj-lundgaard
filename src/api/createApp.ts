import FastifyCors from "@fastify/cors";
import Fastify, { FastifyPluginAsync, FastifyPluginCallback, FastifyRequest } from "fastify";
import { json2csv } from "json-2-csv";

export type NotionWebhookBody = {
  entity: { id: string };
  type: string;
  data: { parent: { data_source_id: string } };
};

export type AppDependencies = {
  queueDashboardPlugin: FastifyPluginAsync | FastifyPluginCallback;
  receivedNotionCommentWebhook: (body: NotionWebhookBody) => Promise<void>;
  receivedNotionPageWebhook: (body: NotionWebhookBody) => Promise<void>;
  readExportTemplate: () => Promise<string>;
  findCustomers: () => Promise<Array<{ id: number; name: string }>>;
  findTaskData: (customerId: number) => Promise<Array<Record<string, unknown>>>;
};

export function createApp(dependencies: AppDependencies) {
  const app = Fastify();
  app.register(FastifyCors, { origin: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] });
  app.register(dependencies.queueDashboardPlugin, { prefix: "/admin/queues" });

  app.post("/notion", async (request: FastifyRequest<{ Body: NotionWebhookBody }>, reply) => {
    if (request.body.type.includes("page")) await dependencies.receivedNotionPageWebhook(request.body);
    else if (request.body.type.includes("comment")) await dependencies.receivedNotionCommentWebhook(request.body);
    reply.send("OK");
  });

  app.get("/export-csv", async (_request, reply) => {
    try {
      reply.header("Content-Type", "text/html; charset=utf-8").send(await dependencies.readExportTemplate());
    } catch {
      reply.code(500).send("Erro ao carregar o formulário");
    }
  });

  app.get("/api/customers", async (_request, reply) => {
    try {
      reply.send(await dependencies.findCustomers());
    } catch {
      reply.code(500).send({ error: "Erro ao buscar clientes" });
    }
  });

  app.post("/export-csv", async (request: FastifyRequest<{ Body: { customerId: number } }>, reply) => {
    try {
      const { customerId } = request.body;
      const csv = json2csv(await dependencies.findTaskData(customerId));
      const filename = `customer-${customerId}.csv`;
      reply.header("Content-Type", "text/csv; charset=utf-8").header(
        "Content-Disposition",
        `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      ).send(csv);
    } catch {
      reply.code(500).send({ error: "Erro ao gerar CSV" });
    }
  });

  return app;
}
