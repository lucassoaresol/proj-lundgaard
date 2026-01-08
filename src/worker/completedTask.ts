import {
  createCompletedTaskWorker,
  excludeCompletedTaskWorker,
  updateCompletedTaskWorker,
} from "./services/completedTask";

createCompletedTaskWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [CREATE COMPLETED TASK] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

createCompletedTaskWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [CREATE COMPLETED TASK] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

excludeCompletedTaskWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [EXCLUDE COMPLETED TASK] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

excludeCompletedTaskWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [EXCLUDE COMPLETED TASK] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

updateCompletedTaskWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [UPDATE COMPLETED TASK] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

updateCompletedTaskWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [UPDATE COMPLETED TASK] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});
