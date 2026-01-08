-- up
CREATE TABLE "completed_tasks" (
  "id" SERIAL PRIMARY KEY,
  "data" JSONB,
  "year_id" INTEGER,
  "task_id" INTEGER,
  "data_source_id" INTEGER NOT NULL,
  "notion_id" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "completed_tasks_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years" ("id") ON DELETE SET NULL ON UPDATE SET NULL,
  CONSTRAINT "completed_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE SET NULL,
  CONSTRAINT "completed_tasks_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "generic_storages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- down
DROP TABLE IF EXISTS "completed_tasks";
