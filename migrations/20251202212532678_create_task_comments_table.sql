-- up
CREATE TABLE "task_comments" (
  "id" SERIAL PRIMARY KEY,
  "data" JSONB,
  "task_id" INTEGER NOT NULL,
  "notion_id" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- down
DROP TABLE IF EXISTS "task_comments";
