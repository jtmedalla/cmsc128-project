# Database

How to work with the database: PostgreSQL 17 + PostGIS, managed by Drizzle.

- Schema: `apps/api/src/database/schema/`, one file per area, with JSDoc on every table and on columns that need explaining
- Migrations: `apps/api/drizzle/`
- Entities, relationships and the rules they keep: [specs/data-model.md](specs/data-model.md)

## Changing the schema

1. Edit the schema. Comment new tables, and columns whose meaning isn't obvious from the code.
2. Generate a migration and review its SQL:

   ```sh
   pnpm db:generate   # writes apps/api/drizzle/<n>_<name>.sql
   pnpm db:migrate
   ```

3. If the change alters the model (a new entity, relationship or rule), update [data-model.md](specs/data-model.md) in the same PR.

After a rebase that brings in someone else's migration, delete yours and regenerate.

## Conventions

- Tables and columns: singular `snake_case`.
- Primary keys: `uuid`. Responder foreign keys: `text` → `user.id`.
- No `DELETE`. Foreign keys are `ON DELETE RESTRICT`; retire rows by status.
- Timestamps are UTC, without time zone. `created_at` and `updated_at` come from the `timestamps` helper in `schema/columns.ts`.
- Enums are Zod enums in `packages/shared/src/enums.ts`, and the `pgEnum`s are built from them. Only add values; removing or renaming one breaks older releases.
- Spatial columns: `geometry` (SRID 4326) via the `customType`s in `schema/columns.ts`, not Drizzle's built-in `geometry`, which drops the SRID. Points read as `{ lng, lat }`, multipolygons as GeoJSON.
- Distances in meters: cast to `geography` (`ST_Distance(a::geography, b::geography)`).
- Spatial queries: `sql` template.

  ```ts
  db.select()
    .from(barangay)
    .where(
      sql`ST_Contains(${barangay.boundary}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))`,
    );
  ```

## Better Auth tables

Generated into `schema/auth.ts` by `pnpm --filter api auth:generate` and migrated by drizzle-kit. Don't edit by hand; after changing auth config or plugins, regenerate, then run `pnpm db:generate`.

| Table          | Holds                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| `user`         | Dashboard accounts. `role` (`admin`, `responder`) and ban fields from the admin plugin |
| `session`      | Active sessions                                                                        |
| `account`      | Credentials per provider (password hash for email login)                               |
| `verification` | Short-lived tokens (email verification, password reset)                                |

## Chat SDK state tables

`chat_state_*` tables belong to Chat SDK's `@chat-adapter/state-pg`, which creates them at startup. They hold expiring state (dedup, locks, subscriptions), not records.

- Not in the Drizzle schema; excluded from drizzle-kit.
- Safe to wipe.
- Never read history from them; use `message`.

## Seed data

Migrations seed reference data every environment needs: incident types, the 119 barangays and partner agencies. `pnpm db:seed` adds a development dataset on top, so everyone builds against the same realistic Miagao data:

| Data        | What's there                                                                                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts    | `admin@migo.local` (admin), `responder@migo.local` and `golez@migo.local` (responders), password `12345678`                                                                                           |
| Residents   | 14 in coastal, lowland and upland barangays, in all four languages, on Messenger and web chat; some with full profiles, some never finished, one opted out of broadcasts                              |
| Reports     | 20 over the last 30 days: every status, incident type and severity; proxies, victims, two hotline calls logged by responders, a duplicate, an abandoned report; pins inside their barangay boundaries |
| Messages    | Each report's conversation with the bot's real questions, answers, location shares and responder replies                                                                                              |
| History     | `report_edit` rows for each status change and correction, reviewers, and `agency_referral` rows by incident type                                                                                      |
| Broadcasts  | Municipality-wide, coastal-only and upland-only advisories, a draft, and a survey with options, deliveries (`sent`, `failed`, `outside_window`) and responses, one escalated into a report            |
| Info, admin | Agency hotlines (fake numbers), knowledge-base entries, and invites that are pending, accepted, revoked and expired                                                                                   |

- It runs in one transaction after creating the accounts, so a failure leaves no partial data. It skips when it finds seeded chat identities (`seed-` external IDs) and refuses when `NODE_ENV` is `production`.
- To start over, run `pnpm db:reset`: it drops the app's tables, enums and migration history (PostGIS stays), then migrates and seeds. It refuses in production and on non-local hosts unless `RESET_REMOTE_DATABASE=yes`, so a stray `DATABASE_URL` can't wipe a shared database.
- Times are relative to when the seed runs, so the dashboard's date filters always have data.
- The seed lives in `apps/api/src/database/seed/`, one file per area. When a feature needs data, add it there: real barangay names, `pointIn` for locations, fake numbers from `fakeMobile`. Use `pnpm --filter api db:seed-user` for an extra account.
