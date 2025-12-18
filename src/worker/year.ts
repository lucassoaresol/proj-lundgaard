import {
  createYearWorker,
  excludeYearWorker,
  updateYearWorker,
} from "./services/year";

createYearWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [CREATE YEAR] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

createYearWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [CREATE YEAR] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

excludeYearWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [EXCLUDE YEAR] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

excludeYearWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [EXCLUDE YEAR] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

updateYearWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [UPDATE YEAR] Tarefa ID ${job.id} processada com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

updateYearWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [UPDATE YEAR] Falha ao processar a tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});
