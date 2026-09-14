import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : entry.name.endsWith(".ts") ? [path] : [];
  }));
  return nested.flat();
}

test("API modules use Queues and never instantiate or import Workers", async () => {
  const apiRoot = new URL("../../src/api/", import.meta.url).pathname;
  const contents = await Promise.all((await sourceFiles(apiRoot)).map((path) => readFile(path, "utf8")));
  const apiSource = contents.join("\n");
  assert.doesNotMatch(apiSource, /new\s+Worker\s*</);
  assert.doesNotMatch(apiSource, /worker\/(?:services|dev)/);
  assert.doesNotMatch(apiSource, /from\s+["']bullmq["']/);
});

test("all recovered dev queues have worker-only consumers and controlled retry options", async () => {
  const root = new URL("../../", import.meta.url).pathname;
  const queues = await readFile(join(root, "src/queues/index.ts"), "utf8");
  const workers = await readFile(join(root, "src/worker/services/dev.ts"), "utf8");
  const source = (await Promise.all((await sourceFiles(join(root, "src"))).map((path) => readFile(path, "utf8")))).join("\n");
  for (const entity of ["customer", "task", "task-comment", "year", "completed-task"]) {
    for (const action of ["create", "update", "exclude"]) {
      const name = `${action}-${entity}-dev`;
      assert.match(queues, new RegExp(`new Queue(?:<[^>]+>)?\\(\"${name}\"`));
      assert.match(workers, new RegExp(`\"${name}\"`));
    }
  }
  assert.doesNotMatch(source, /attempts\s*:\s*(?:1000|1e3)/);
  assert.match(source, /attempts:\s*5/);
});
