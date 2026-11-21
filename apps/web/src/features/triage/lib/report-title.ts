import type { ReportDetail } from '@repo/shared';

/** "Flood · Mat-y": the incident type, plus the barangay when known. */
export function reportTitle(report: ReportDetail) {
  const type = report.incidentType?.name ?? 'Unclassified incident';
  return report.barangay ? `${type} · ${report.barangay.name}` : type;
}
