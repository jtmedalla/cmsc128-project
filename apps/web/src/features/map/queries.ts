/**
 * Spatial reads: heatmap aggregates and map pins. Report data itself comes from `reportQueries`. No queries yet; add each as a `queryOptions` keyed under `all()`
 * (docs/architecture.md).
 */
export const mapQueries = {
  all: () => ['map'] as const,
};
