# Map

Incident map pins and, later, the heatmap (EP7).

- API: `apps/api/src/map/` (empty; pins read the triage feed)
- Web: `apps/web/src/features/map/`

## Dashboard

- `/dashboard/map`: pins from `reportFeedQuery`, filtered by type, severity, status and date. Loaded lazily (NFR9).

Map depends on triage, never the reverse. Spatial queries (heatmap aggregation, GeoJSON pins) belong here, not in triage.
