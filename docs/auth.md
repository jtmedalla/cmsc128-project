# Auth

Sessions and role guards. A platform module: no epic of its own.

- API: `apps/api/src/auth/`
- Web: `apps/web/src/features/auth/`

## Guards

- API: every route needs a session (Better Auth global guard). `@AllowAnonymous()` opens a route; `@Roles([...])` restricts it.
- Web: `/dashboard/_app` redirects signed-out users to `/login`. `requireRole` in a route's `beforeLoad` hides pages from other roles; the API's `@Roles` is what enforces access.
