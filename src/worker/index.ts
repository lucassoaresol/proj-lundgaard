import {
  createCustomerWorker,
  excludeCustomerWorker,
  updateCustomerWorker,
} from "./services/customer";

createCustomerWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [CREATE CUSTOMER] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

createCustomerWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [CREATE CUSTOMER] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

excludeCustomerWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [EXCLUDE CUSTOMER] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

excludeCustomerWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [EXCLUDE CUSTOMER] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

updateCustomerWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [UPDATE CUSTOMER] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

updateCustomerWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [UPDATE CUSTOMER] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});
