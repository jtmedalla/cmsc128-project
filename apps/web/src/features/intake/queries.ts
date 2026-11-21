/**
 * Report-form data, such as the incident types residents pick from. No queries yet; add each as a `queryOptions` keyed under `all()`
 * (docs/architecture.md).
 */
export const intakeQueries = {
  all: () => ['intake'] as const,
};
