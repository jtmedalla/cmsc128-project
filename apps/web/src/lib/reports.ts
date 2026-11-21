import {
  type ReportDetail,
  reportDetailSchema,
  type ReportFeedItem,
  reportFeedItemSchema,
} from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { API_URL } from './env';

/** Every report for the incidents list, newest first. */
// TODO(#38): invalidate on report:created / report:updated for live updates.
export const reportFeedQuery = queryOptions({
  // Under ['reports'], so the feed invalidation in docs/realtime.md covers it.
  queryKey: ['reports', 'feed'],
  queryFn: async (): Promise<ReportFeedItem[]> => {
    const res = await fetch(`${API_URL}/triage/reports`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`Couldn't load reports (${res.status})`);
    // parse() decodes the ISO date strings back into Dates.
    return reportFeedItemSchema.array().parse(await res.json());
  },
});

/** "Flood · Mat-y": the incident type, plus the barangay when known. */
export function reportTitle(report: ReportDetail) {
  const type = report.incidentType?.name ?? 'Unclassified incident';
  return report.barangay ? `${type} · ${report.barangay.name}` : type;
}

/** One report for responders, or null when no report has that ID. */
export function reportDetailQuery(id: string) {
  return queryOptions({
    // 'detail' keeps the feed's ['reports'] invalidation (docs/realtime.md) from refetching open details.
    queryKey: ['reports', 'detail', id],
    queryFn: async (): Promise<ReportDetail | null> => {
      // The API is on another origin, so send the session cookie explicitly.
      const res = await fetch(`${API_URL}/triage/reports/${id}`, {
        credentials: 'include',
      });
      // 400 is a malformed ID, which can't match any report either.
      if (res.status === 404 || res.status === 400) return null;
      if (!res.ok) throw new Error(`Couldn't load report (${res.status})`);
      // parse() decodes the ISO date strings back into Dates.
      return reportDetailSchema.parse(await res.json());
    },
  });
}
