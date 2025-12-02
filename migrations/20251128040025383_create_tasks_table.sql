-- up
CREATE TABLE "tasks" (
  "id" SERIAL PRIMARY KEY,
  "data" JSONB,
  "customer_id" INTEGER,
  "notion_id" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tasks_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE SET NULL
);

-- down
DROP TABLE IF EXISTS "tasks";
