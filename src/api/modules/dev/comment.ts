import {
  createTaskCommentDevQueue,
  excludeTaskCommentDevQueue,
  updateTaskCommentDevQueue,
} from "../../../queues";
import { CONTROLLED_RETRY_OPTIONS } from "../../../worker/retryPolicy";
import type { NotionWebhookBody } from "../../createApp";

export async function receivedNotionCommentDevWebhook(body: NotionWebhookBody) {
  if (body.type === "comment.created") {
    await createTaskCommentDevQueue.add("save-create-task-comment-dev", body.entity.id, CONTROLLED_RETRY_OPTIONS);
  }
  if (body.type === "comment.updated") {
    await updateTaskCommentDevQueue.add("save-update-task-comment-dev", body.entity.id, CONTROLLED_RETRY_OPTIONS);
  }
  if (body.type === "comment.deleted") {
    await excludeTaskCommentDevQueue.add("save-exclude-task-comment-dev", body.entity.id, CONTROLLED_RETRY_OPTIONS);
  }
}
