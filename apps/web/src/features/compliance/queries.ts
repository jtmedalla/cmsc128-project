/**
 * Exports, sheet sync status and SitReps. No queries yet; add each as a `queryOptions` keyed under `all()`
 * (docs/architecture.md).
 */
export const complianceQueries = {
  all: () => ['compliance'] as const,
};
