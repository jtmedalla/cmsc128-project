# Health

API and database health for uptime pings and the System status page. A platform module.

- API: `apps/api/src/health/`
- Web: `apps/web/src/features/health/`
- Schemas: `packages/shared/src/health/`

## Endpoints

- `GET /health`: public. 200 when every check passes, 503 with the failing check otherwise.

## Dashboard

- `/dashboard/health`: reached from the user menu, not the sidebar.
