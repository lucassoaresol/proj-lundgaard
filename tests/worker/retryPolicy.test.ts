import assert from "node:assert/strict";
import test from "node:test";

import { UnrecoverableError } from "bullmq";

import {
  classifyJobError,
  CONTROLLED_RETRY_OPTIONS,
  runWithRetryPolicy,
} from "../../src/worker/retryPolicy";

function errorWith(
  attributes: Record<string, unknown>,
  message = "request failed",
) {
  return Object.assign(new Error(message), attributes);
}

async function executeWithBullMqSemantics(
  operation: () => Promise<void>,
): Promise<number> {
  let executions = 0;

  for (
    let attempt = 1;
    attempt <= CONTROLLED_RETRY_OPTIONS.attempts;
    attempt += 1
  ) {
    executions += 1;

    try {
      await runWithRetryPolicy(operation);
      break;
    } catch (error) {
      if (error instanceof UnrecoverableError) {
        break;
      }

      if (attempt === CONTROLLED_RETRY_OPTIONS.attempts) {
        break;
      }
    }
  }

  return executions;
}

test("classifies Notion object_not_found as permanent", () => {
  assert.deepEqual(
    classifyJobError(errorWith({ code: "object_not_found", status: 404 })),
    { errorClass: "NOTION_OBJECT_NOT_FOUND", retryable: false },
  );
});

test("classifies Notion rate limiting and server failures as transient", () => {
  assert.deepEqual(
    classifyJobError(errorWith({ code: "rate_limited", status: 429 })),
    { errorClass: "NOTION_RATE_LIMITED", retryable: true },
  );
  assert.deepEqual(
    classifyJobError(
      errorWith({ code: "internal_server_error", status: 500 }),
    ),
    { errorClass: "NOTION_SERVER_ERROR", retryable: true },
  );
  assert.deepEqual(
    classifyJobError(
      errorWith({ code: "service_unavailable", status: 503 }),
    ),
    { errorClass: "NOTION_SERVER_ERROR", retryable: true },
  );
});

test("classifies Redis and ECONNRESET failures as transient", () => {
  assert.deepEqual(
    classifyJobError(
      errorWith({ name: "MaxRetriesPerRequestError" }, "Redis unavailable"),
    ),
    { errorClass: "REDIS_TRANSIENT", retryable: true },
  );
  assert.deepEqual(
    classifyJobError(errorWith({ code: "ECONNRESET" })),
    { errorClass: "NETWORK_TRANSIENT", retryable: true },
  );
});

test("converts permanent failures to BullMQ UnrecoverableError", async () => {
  const permanentError = errorWith({ code: "object_not_found", status: 404 });

  await assert.rejects(
    runWithRetryPolicy(async () => {
      throw permanentError;
    }),
    (error: unknown) => {
      assert.ok(error instanceof UnrecoverableError);
      assert.equal(error.message, "NOTION_OBJECT_NOT_FOUND");
      return true;
    },
  );
});

test("keeps transient failures retryable and limits them to the common policy", async () => {
  const transientError = errorWith({ code: "ECONNRESET" });

  await assert.rejects(
    runWithRetryPolicy(async () => {
      throw transientError;
    }),
    (error: unknown) => error === transientError,
  );

  const executions = await executeWithBullMqSemantics(async () => {
    throw transientError;
  });

  assert.equal(executions, 5);
  assert.deepEqual(CONTROLLED_RETRY_OPTIONS, {
    attempts: 5,
    backoff: { type: "exponential", delay: 5000, jitter: 0.5 },
  });
});

test("permanent failures stop after the first execution", async () => {
  const executions = await executeWithBullMqSemantics(async () => {
    throw errorWith({ code: "object_not_found", status: 404 });
  });

  assert.equal(executions, 1);
});
