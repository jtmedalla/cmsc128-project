/**
 * Whether `error` is Postgres's unique violation (23505), raised directly or
 * wrapped as the `cause` of Drizzle's query error.
 */
export function isUniqueViolation(error: unknown): boolean {
  const codeOf = (value: unknown) =>
    typeof value === 'object' && value !== null && 'code' in value
      ? value.code
      : undefined;
  const cause =
    typeof error === 'object' && error !== null && 'cause' in error
      ? error.cause
      : undefined;
  return codeOf(error) === '23505' || codeOf(cause) === '23505';
}
