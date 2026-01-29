-- up
ALTER TABLE "tasks"
  ADD COLUMN "status" TEXT,
  ADD COLUMN "due_date" TIMESTAMP(3);

-- down
ALTER TABLE "tasks"
  DROP COLUMN "status",
  DROP COLUMN "due_date";
