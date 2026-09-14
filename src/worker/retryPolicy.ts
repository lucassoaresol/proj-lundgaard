import { UnrecoverableError } from "bullmq";

export const CONTROLLED_RETRY_OPTIONS = {
  attempts: 5,
  backoff: {
    type: "exponential" as const,
    delay: 5000,
    jitter: 0.5,
  },
};

export type JobErrorClass =
  | "NOTION_OBJECT_NOT_FOUND"
  | "NOTION_AUTHORIZATION"
  | "NOTION_INVALID_REQUEST"
  | "NOTION_RATE_LIMITED"
  | "NOTION_CONFLICT"
  | "NOTION_SERVER_ERROR"
  | "NOTION_TIMEOUT"
  | "POSTGRES_FOREIGN_KEY_VIOLATION"
  | "POSTGRES_UNIQUE_VIOLATION"
  | "REDIS_TRANSIENT"
  | "NETWORK_TRANSIENT"
  | "HTTP_CLIENT_ERROR"
  | "HTTP_SERVER_ERROR"
  | "UNKNOWN";

export type JobErrorClassification = {
  errorClass: JobErrorClass;
  retryable: boolean;
};

type ErrorLike = {
  code?: unknown;
  status?: unknown;
  name?: unknown;
  message?: unknown;
};

const NOTION_PERMANENT_CODES = new Set([
  "unauthorized",
  "restricted_resource",
  "invalid_json",
  "invalid_request_url",
  "invalid_request",
  "validation_error",
]);

const NETWORK_TRANSIENT_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EPIPE",
  "ETIMEDOUT",
  "EAI_AGAIN",
]);

const REDIS_TRANSIENT_NAMES = new Set([
  "ClusterAllFailedError",
  "MaxRetriesPerRequestError",
]);

function asErrorLike(error: unknown): ErrorLike {
  return typeof error === "object" && error !== null ? error : {};
}

const KNOWN_ERROR_CLASSES = new Set<JobErrorClass>([
  "NOTION_OBJECT_NOT_FOUND", "NOTION_AUTHORIZATION", "NOTION_INVALID_REQUEST",
  "NOTION_RATE_LIMITED", "NOTION_CONFLICT", "NOTION_SERVER_ERROR",
  "NOTION_TIMEOUT", "POSTGRES_FOREIGN_KEY_VIOLATION",
  "POSTGRES_UNIQUE_VIOLATION", "REDIS_TRANSIENT", "NETWORK_TRANSIENT",
  "HTTP_CLIENT_ERROR", "HTTP_SERVER_ERROR", "UNKNOWN",
]);

export function classifyJobError(error: unknown): JobErrorClassification {
  const errorLike = asErrorLike(error);
  const code = typeof errorLike.code === "string" ? errorLike.code : undefined;
  const status =
    typeof errorLike.status === "number" ? errorLike.status : undefined;
  const name = typeof errorLike.name === "string" ? errorLike.name : undefined;
  const message =
    typeof errorLike.message === "string" ? errorLike.message : "";

  if (name === "UnrecoverableError" && KNOWN_ERROR_CLASSES.has(message as JobErrorClass)) {
    return { errorClass: message as JobErrorClass, retryable: false };
  }

  if (code === "object_not_found") {
    return { errorClass: "NOTION_OBJECT_NOT_FOUND", retryable: false };
  }

  if (code === "unauthorized" || code === "restricted_resource") {
    return { errorClass: "NOTION_AUTHORIZATION", retryable: false };
  }

  if (NOTION_PERMANENT_CODES.has(code ?? "")) {
    return { errorClass: "NOTION_INVALID_REQUEST", retryable: false };
  }

  if (code === "rate_limited" || status === 429) {
    return { errorClass: "NOTION_RATE_LIMITED", retryable: true };
  }

  if (code === "conflict_error" || status === 409) {
    return { errorClass: "NOTION_CONFLICT", retryable: true };
  }

  if (code === "internal_server_error" || code === "service_unavailable") {
    return { errorClass: "NOTION_SERVER_ERROR", retryable: true };
  }

  if (code === "notionhq_client_request_timeout") {
    return { errorClass: "NOTION_TIMEOUT", retryable: true };
  }

  if (code === "23503") {
    return {
      errorClass: "POSTGRES_FOREIGN_KEY_VIOLATION",
      retryable: false,
    };
  }

  if (code === "23505") {
    return { errorClass: "POSTGRES_UNIQUE_VIOLATION", retryable: false };
  }

  if (NETWORK_TRANSIENT_CODES.has(code ?? "")) {
    return { errorClass: "NETWORK_TRANSIENT", retryable: true };
  }

  if (
    REDIS_TRANSIENT_NAMES.has(name ?? "") ||
    /redis.*(?:connection|socket)|connection is closed|max retries per request/i.test(
      message,
    )
  ) {
    return { errorClass: "REDIS_TRANSIENT", retryable: true };
  }

  if (status !== undefined && status >= 500 && status <= 599) {
    return { errorClass: "HTTP_SERVER_ERROR", retryable: true };
  }

  if (status === 408) {
    return { errorClass: "NETWORK_TRANSIENT", retryable: true };
  }

  if (status !== undefined && status >= 400 && status <= 499) {
    return { errorClass: "HTTP_CLIENT_ERROR", retryable: false };
  }

  return { errorClass: "UNKNOWN", retryable: true };
}

export async function runWithRetryPolicy<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof UnrecoverableError) {
      throw error;
    }

    const classification = classifyJobError(error);

    if (!classification.retryable) {
      throw new UnrecoverableError(classification.errorClass);
    }

    throw error;
  }
}
