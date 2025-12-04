-- up
ALTER TABLE "task_comments"
  ADD COLUMN "expired_at" TIMESTAMP(3);

-- down
ALTER TABLE "task_comments"
  DROP COLUMN "expired_at";
