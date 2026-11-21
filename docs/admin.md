# Admin

Accounts, invites, incident types and agencies (EP10).

- API: `apps/api/src/admin/`
- Web: `apps/web/src/features/admin/`

## Dashboard

All `/dashboard/admin/*` pages are admin-only (`requireRole` on the `admin` layout route). `/dashboard/admin` redirects to Users.

- `/dashboard/admin/users`: accounts and roles; invites open as a dialog here (stub).
- `/dashboard/admin/incident-types`: stub.
- `/dashboard/admin/agencies`: stub.
- `/dashboard/help`: in-app help, for every role, opened from the user menu (stub).
