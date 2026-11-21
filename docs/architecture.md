# Architecture

MIGO is split into vertical modules named after the TRD module list. A module has the same name everywhere:

- API: `apps/api/src/<module>/`, with routes under `/<module>/...`
- Web: `apps/web/src/features/<module>/`
- Shared schemas: `packages/shared/src/<module>/`
- Docs: `docs/<module>.md`
- Issue label: `mod:<module>`

Route prefix exceptions: Better Auth owns `/api/auth/*`, and chat webhooks stay at `/webhooks/:platform` because the Meta app points there.

## Modules

| Module       | Epic                                  | Web routes                                        |
| ------------ | ------------------------------------- | ------------------------------------------------- |
| `intake`     | #5 Report intake                      | `/report`                                         |
| `channels`   | #5 Report intake                      | none (web chat is stretch)                        |
| `feedback`   | #6 Report feedback                    | `/status/:token`                                  |
| `residents`  | #7 Resident profile                   | `/dashboard/residents/*`                          |
| `info`       | #8 Public information                 | `/`, `/info`, `/info/hotlines`                    |
| `broadcasts` | #9 Broadcasts                         | `/dashboard/broadcasts/*`                         |
| `triage`     | #10 Incident triage                   | `/dashboard/incidents/*`                          |
| `map`        | #11 Incident visualization            | `/dashboard/map`                                  |
| `messaging`  | #12 Responder-resident messaging      | none (a panel inside incident and resident pages) |
| `compliance` | #13 Compliance records                | `/dashboard/export`                               |
| `admin`      | #14 Access control and administration | `/dashboard/admin/*`, `/dashboard/help`           |

Platform modules have no epic and serve the others: `auth`, `realtime`, `geo`, `jobs` (not created until background jobs land), `database`, `config`, `health`. `geo` has no screens; `map` uses it.

The dashboard home (`/dashboard`) belongs to no module. Its summary widgets come from the modules that own the data.

## Ownership

- The module that owns the data owns its endpoints and screens, wherever they appear. Knowledge-base edit pages belong to `info`, not `admin`.
- A module may own a view over another module's data if the dependency goes one way. `map` reads reports through triage's exports and owns spatial queries; triage never imports `map`.
- Aggregates (counts, stats) live with the module that owns the data.

## Web layout

```
apps/web/src/
  features/<module>/   one folder per module
  components/          app shell and pieces used by two or more features
  components/ui/       shadcn primitives
  lib/                 app-wide helpers (env, format, query client, cn)
  hooks/               app-wide hooks
  routes/              TanStack Router file routes
```

A feature folder holds what it needs from:

- `api.ts`: TanStack Query options for the module's endpoints, calling the shared client `api` from `@/lib/api` (`get`, `getOrNull`, `post`, `put`, `patch`, `delete`)
- `components/`: React components, with tests beside them
- `hooks/`, `lib/`: feature-only hooks and helpers
- `index.ts`: the public surface

## Import rules

- Inside a feature, import with relative paths.
- From outside a feature, import only from its `index.ts` (`@/features/triage`), never from a file inside it.
- Feature dependencies go one way. `map` may import `triage`; `triage` never imports `map`.
- Route files only wire a feature in: guards, search params, and the feature's page component.
- Code moves to `components/` or `lib/` once a second feature needs it.
