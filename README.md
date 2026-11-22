<p align="center">
  <img src="apps/web/public/logo.svg" alt="MIGO logo" width="96">
</p>

<h1 align="center">MIGO</h1>

<p align="center">
  Miagao Incident Gateway for Operations: incident intake for MDRRMO Miagao.
  <br>
  <a href="docs/README.md">Docs</a> ·
  <a href="https://github.com/orgs/sleeping-angels/projects/1">Project board</a> ·
  <a href="https://www.figma.com/design/hW0DADlcpwQ231WD1uCaZX/CMSC128_Final-Project">Wireframes</a>
</p>

Residents report incidents through Messenger or a web form, and get a status link back. Responders see reports live on a dashboard, correct them, and send advisories to the barangays that need them.

## Stack

| Path              | What                                                     |
| ----------------- | -------------------------------------------------------- |
| `apps/api`        | NestJS, Drizzle, Better Auth, PostgreSQL + PostGIS       |
| `apps/web`        | React, Vite, TanStack Router and Query, Tailwind, shadcn |
| `packages/shared` | Zod schemas and types used by both apps                  |

pnpm workspaces and Turborepo tie them together. Architecture and the reasons behind it are in the [TRD](docs/specs/trd.md).

## Getting started

You need Node 22+, pnpm 10, and Docker (or a [Neon](https://neon.tech) database).

1. Install and copy the env files:

   ```sh
   pnpm install
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

2. Set `BETTER_AUTH_SECRET` in `apps/api/.env` to the output of `openssl rand -base64 32`.

3. Start the database, then migrate and seed it:

   ```sh
   docker compose up -d
   pnpm db:migrate
   pnpm db:seed
   ```

   On Neon, skip Docker and put your branch's connection string in `DATABASE_URL`.

4. Run everything:

   ```sh
   pnpm dev
   ```

   The web app is at http://localhost:5173 and the API at http://localhost:3000 (API docs at `/docs`).

Sign in with a seeded account (password `12345678`): `admin@migo.local`, or `responder@migo.local` for a responder. The seed also adds residents, reports and broadcasts; see [what's in it](docs/database.md#seed-data).

Messenger stays off until its three `FACEBOOK_*` variables are set; see [docs/channels.md](docs/channels.md).

## Scripts

| Script                            | Does                                                    |
| --------------------------------- | ------------------------------------------------------- |
| `pnpm dev`                        | Run every app in watch mode                             |
| `pnpm build`                      | Build every package and app                             |
| `pnpm lint`, `typecheck`, `test`  | Check the code (CI runs all three plus `build`)         |
| `pnpm format`                     | Format with Prettier                                    |
| `pnpm db:generate`                | Generate a migration from the schema                    |
| `pnpm db:migrate`                 | Apply migrations                                        |
| `pnpm db:seed`                    | Load the development dataset                            |
| `pnpm db:reset`                   | Wipe, migrate and reseed a local database               |
| `pnpm --filter api db:seed-user`  | Add a dashboard account (public sign-up is off)         |
| `pnpm --filter api auth:generate` | Regenerate Better Auth tables after auth config changes |

## Docs

- [Specs](docs/specs/): [PRD](docs/specs/prd.md), [TRD](docs/specs/trd.md), [data model](docs/specs/data-model.md), [sitemap](docs/specs/sitemap.md), [user flows](docs/specs/user-flows.md), [brand](docs/specs/brand.md)
- [Architecture](docs/architecture.md), [database](docs/database.md), [testing](docs/testing.md), and one doc per module
- [How docs are written](docs/README.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Agent skills live in `.agents/skills`; link them for your agent with `npx skills experimental_install`.
