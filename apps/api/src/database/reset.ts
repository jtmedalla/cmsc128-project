/**
 * Drops the app's tables, enums and migration history so `db:migrate` and
 * `db:seed` can rebuild from scratch. Run through `pnpm db:reset`, which does
 * all three. Extensions (PostGIS) stay. Local databases only, unless
 * RESET_REMOTE_DATABASE=yes.
 */
import { sql } from 'drizzle-orm';
import { env } from '../config/env.js';
import { db, pool } from './client.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

async function reset() {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to reset a database in production');
  }
  const url = new URL(env.DATABASE_URL);
  const target = `${url.hostname}${url.pathname}`;
  if (
    !LOCAL_HOSTS.has(url.hostname) &&
    process.env.RESET_REMOTE_DATABASE !== 'yes'
  ) {
    throw new Error(
      `Refusing to reset remote database ${target}. Set RESET_REMOTE_DATABASE=yes if it's your own dev branch.`,
    );
  }

  // Skips objects that belong to extensions, such as PostGIS's spatial_ref_sys.
  await db.execute(sql`
    do $$
    declare r record;
    begin
      for r in
        select c.relname from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('r', 'p')
          and not exists (
            select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e'
          )
      loop
        execute format('drop table if exists public.%I cascade', r.relname);
      end loop;
      for r in
        select t.typname from pg_type t
        join pg_namespace n on n.oid = t.typnamespace
        where n.nspname = 'public' and t.typtype = 'e'
          and not exists (
            select 1 from pg_depend d where d.objid = t.oid and d.deptype = 'e'
          )
      loop
        execute format('drop type if exists public.%I cascade', r.typname);
      end loop;
    end $$;
  `);
  await db.execute(sql`drop schema if exists drizzle cascade`);
  console.log(`Reset ${target}.`);
}

try {
  await reset();
} finally {
  await pool.end();
}
