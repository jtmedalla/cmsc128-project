import { type ReportDetail, reportDetailSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { API_URL } from './env';

/** One report for responders, or null when no report has that ID. */
export function reportDetailQuery(id: string) {
  return queryOptions({
    queryKey: ['reports', id],
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
