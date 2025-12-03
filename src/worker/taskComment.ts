import {
  createTaskCommentWorker,
  excludeTaskCommentWorker,
  updateTaskCommentWorker,
} from "./services/taskComment";

createTaskCommentWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [CREATE TASK COMMENT] Comentário de tarefa ID ${job.id} processado com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

createTaskCommentWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [CREATE TASK COMMENT] Falha ao processar o comentário de tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

excludeTaskCommentWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [EXCLUDE TASK COMMENT] Comentário de tarefa ID ${job.id} processado com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

excludeTaskCommentWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [EXCLUDE TASK COMMENT] Falha ao processar o comentário de tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});

updateTaskCommentWorker.on("completed", (job) => {
  console.log(
    `✅ [Sucesso] [UPDATE TASK COMMENT] Comentário de tarefa ID ${job.id} processado com sucesso.`,
  );
  console.log(`Detalhes do Job: ${JSON.stringify(job.data)}`);
});

updateTaskCommentWorker.on("failed", async (job, err) => {
  console.error(
    `❌ [Erro] [UPDATE TASK COMMENT] Falha ao processar o comentário de tarefa ID ${job?.id}. Motivo: ${err.message}`,
  );
  console.error(`Detalhes do Job: ${JSON.stringify(job?.data)}`);
});
