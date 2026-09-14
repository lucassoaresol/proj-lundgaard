import { createTaskCommentQueue, updateTaskCommentQueue, excludeTaskCommentQueue } from "../../queues";
import { CONTROLLED_RETRY_OPTIONS } from "../../worker/retryPolicy";

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
      CONTROLLED_RETRY_OPTIONS,
    );
  }

  if (body.type === "comment.updated") {
    await updateTaskCommentQueue.add(
      "save-update-task-comment",
      body.entity.id,
      CONTROLLED_RETRY_OPTIONS,
    );
  }

  if (body.type === "comment.deleted") {
    await excludeTaskCommentQueue.add(
      "save-exclude-task-comment",
      body.entity.id,
      CONTROLLED_RETRY_OPTIONS,
    );
  }
}
