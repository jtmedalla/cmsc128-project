# Triage

Lets responders review reports. Read-only for now; editing arrives with #39.

- API: `apps/api/src/triage/`
- Web: `apps/web/src/components/report-details.tsx`, `apps/web/src/lib/reports.ts`
- Schemas: `packages/shared/src/reports/`

## Report details

`GET /triage/reports/:id` returns one report as `reportDetailSchema`, for any signed-in user. It returns 400 for a malformed ID and 404 when no report has it.

Unlike a feed item, the detail carries the resident's contact number, the victims and the conversation the report came from, oldest first. Keep it off public pages.

`parse_confidence` and `message.attachments` are `jsonb`, so `ReportsService.findDetail` checks them against `parseConfidenceSchema` and `messageAttachmentsSchema` and returns null for a value of the wrong shape instead of failing the response.

## Feed queries

`triage/feed.ts` holds the projection the feed and the detail share: `reportColumns` hides internal links and the tracking token, and `reportRelations` adds the incident type and barangay. `findFeedItems(db, where?)` and `findFeedItem(db, id)` load feed items; intake uses `findFeedItem` to push `report:created`. `checkConfidence` and `checkAttachments` do the jsonb checks for both.

## Contracts

| Schema                     | Shape                                                    |
| -------------------------- | -------------------------------------------------------- |
| `reportDetailSchema`       | One report as a responder reviews it                     |
| `reportIdParamsSchema`     | `{ id }` route params for one report                     |
| `messageAttachmentsSchema` | `message.attachments`, reduced to each attachment's type |
