import { Database } from "pg-utils";

import getDatabase from "./database";

const databaseNotionPromise: Promise<Database> = (async () => {
  return await getDatabase("notion");
})();

export default databaseNotionPromise;
