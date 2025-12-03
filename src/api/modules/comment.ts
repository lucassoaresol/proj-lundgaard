import { createTaskCommentQueue, updateTaskCommentQueue, excludeTaskCommentQueue } from "../../worker/services/taskComment";

export async function receivedNotionCommentWebhook(body: {
  entity: { id: string };
  type: string;
  data: {
    parent: {
      data_source_id: string;
    };
  };
}) {
  if (body.type === "comment.created") {
    await createTaskCommentQueue.add(
      "save-create-task-comment",
      body.entity.id,
      { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
    );
  }

  if (body.type === "comment.updated") {
    await updateTaskCommentQueue.add(
      "save-update-task-comment",
      body.entity.id,
      { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
    );
  }

  if (body.type === "comment.deleted") {
    await excludeTaskCommentQueue.add(
      "save-exclude-task-comment",
      body.entity.id,
      { attempts: 1000, backoff: { type: "exponential", delay: 5000 } },
    );
  }
}
