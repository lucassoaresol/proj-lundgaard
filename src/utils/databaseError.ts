export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  return (error as { code?: unknown }).code === "23505";
}

export function isUniqueViolationOnConstraint(
  error: unknown,
  constraint: string,
): boolean {
  if (!isUniqueViolation(error)) return false;
  return (error as { constraint?: unknown }).constraint === constraint;
}

function safeDatabaseIdentifier(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-zA-Z0-9_.-]{1,128}$/.test(value)
    ? value
    : undefined;
}

export function databaseErrorMetadata(error: unknown): {
  code?: string;
  constraint?: string;
} {
  if (!error || typeof error !== "object") return {};
  const candidate = error as { code?: unknown; constraint?: unknown };

  const code = safeDatabaseIdentifier(candidate.code);
  const constraint = safeDatabaseIdentifier(candidate.constraint);

  return {
    ...(code ? { code } : {}),
    ...(constraint ? { constraint } : {}),
  };
}
