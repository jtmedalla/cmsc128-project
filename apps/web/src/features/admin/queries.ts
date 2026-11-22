/**
 * Accounts, invites, incident types and agencies. No queries yet; add each as a
 * `queryOptions` keyed under `all()` (docs/architecture.md). Barangays live in
 * `@/features/geo`.
 */
export const adminQueries = {
  all: () => ['admin'] as const,
};
