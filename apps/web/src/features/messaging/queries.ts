/**
 * Direct responder-resident threads. No queries yet; add each as a `queryOptions` keyed under `all()`
 * (docs/architecture.md).
 */
export const messagingQueries = {
  all: () => ['messaging'] as const,
};
