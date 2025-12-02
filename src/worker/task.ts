import {
  createTaskWorker,
  excludeTaskWorker,
  updateTaskWorker,
} from "./services/task";

createTaskWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [CREATE TASK] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

createTaskWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [CREATE TASK] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

excludeTaskWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [EXCLUDE TASK] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

excludeTaskWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [EXCLUDE TASK] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

updateTaskWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [UPDATE TASK] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

updateTaskWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [UPDATE TASK] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});
