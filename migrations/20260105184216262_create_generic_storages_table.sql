-- up
CREATE TABLE "generic_storages" (
  "id" SERIAL PRIMARY KEY,
  "identifier" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_generic_storages_updated_at
BEFORE UPDATE ON "generic_storages"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- down
DROP TRIGGER IF EXISTS update_generic_storages_updated_at ON "generic_storages";

DROP TABLE IF EXISTS "generic_storages";
