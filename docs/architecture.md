# Architecture

MIGO is split into vertical modules named after the TRD module list. A module has the same name in the API (`apps/api/src/<module>/`) and the web app (`apps/web/src/features/<module>/`).

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

- `api.ts`: TanStack Query options for the module's endpoints
- `components/`: React components, with tests beside them
- `hooks/`, `lib/`: feature-only hooks and helpers
- `index.ts`: the public surface

## Import rules

- Inside a feature, import with relative paths.
- From outside a feature, import only from its `index.ts` (`@/features/triage`), never from a file inside it.
- Feature dependencies go one way. `map` may import `triage`; `triage` never imports `map`.
- Route files only wire a feature in: guards, search params, and the feature's page component.
- Code moves to `components/` or `lib/` once a second feature needs it.
