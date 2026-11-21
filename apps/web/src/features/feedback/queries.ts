/**
 * Public report status by tracking token. No queries yet; add each as a `queryOptions` keyed under `all()`
 * (docs/architecture.md).
 */
export const feedbackQueries = {
  all: () => ['feedback'] as const,
};
