import { reportDetailSchema, reportFeedItemSchema } from '@repo/shared';
import { queryOptions } from '@tanstack/react-query';
import { apiFetch, apiFetchOrNull } from '@/lib/api';

/** Every report for the incidents list, newest first. */
// TODO(#38): invalidate on report:created / report:updated for live updates.
export const reportFeedQuery = queryOptions({
  // Under ['reports'], so the feed invalidation in docs/realtime.md covers it.
  queryKey: ['reports', 'feed'],
  queryFn: ({ signal }) =>
    apiFetch('/triage/reports', reportFeedItemSchema.array(), { signal }),
});

/** One report for responders, or null when no report has that ID. */
export function reportDetailQuery(id: string) {
  return queryOptions({
    // 'detail' keeps the feed's ['reports'] invalidation (docs/realtime.md) from refetching open details.
    queryKey: ['reports', 'detail', id],
    queryFn: ({ signal }) =>
      apiFetchOrNull(`/triage/reports/${id}`, reportDetailSchema, {
        signal,
        // 400 is a malformed ID, which can't match any report either.
        missing: [400, 404],
      }),
  });
}
