# Admin

Accounts, invites, incident types and agencies (EP10).

- API: `apps/api/src/admin/`
- Web: `apps/web/src/features/admin/`

## Dashboard

All `/dashboard/admin/*` pages are admin-only (`requireRole` on the `admin` layout route). `/dashboard/admin` redirects to Users.

- `/dashboard/admin/users`: accounts and roles; invites open as a dialog here (stub).
- `/dashboard/admin/incident-types`: lists every incident type; admins add, rename and retire them (see below).
- `/dashboard/admin/agencies`: stub.
- `/dashboard/help`: in-app help, for every role, opened from the user menu (stub).

## Incident types

`/admin/incident-types` (admin only) backs the page (FR45):

- `GET` lists every type, retired ones included, by name.
- `POST { name }` adds an active type. Its `code`, the stable key the classifier returns, comes from the name through `incidentTypeCode` (`Storm surge` → `storm_surge`) and never changes. A taken code returns 409.
- `PATCH /:id { name?, isActive? }` renames, retires or restores a type; 404 for an unknown ID.

Types are never deleted, since reports reference them. Retiring sets `is_active` to false: intake's `GET /intake/incident-types`, chat's "What happened?" choices and the report form list only active types, while past reports keep theirs. Types added here get the fallback icon unless their code is in `lib/incident-types.ts`.
