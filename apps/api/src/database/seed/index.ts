/**
 * A realistic development dataset: accounts, residents, reports with their
 * conversations, broadcasts, hotlines, knowledge-base entries and invites.
 * Run with `pnpm db:seed` after `pnpm db:migrate`. Skips if it already ran;
 * refuses in production. See docs/database.md.
 */
import { like } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { db, pool } from '../client.js';
import {
  agency,
  barangay,
  incidentType,
  residentChannel,
} from '../schema/index.js';
import { seedAccounts, SEED_PASSWORD } from './accounts.js';
import { seedInvites } from './admin.js';
import { seedBroadcasts } from './broadcasts.js';
import { SEED_PREFIX } from './context.js';
import { seedInfo } from './info.js';
import { seedReports } from './reports.js';
import { seedResidents } from './residents.js';

async function seed() {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed sample data in production');
  }

  const [existing] = await db
    .select({ id: residentChannel.id })
    .from(residentChannel)
    .where(like(residentChannel.externalId, `${SEED_PREFIX}%`))
    .limit(1);
  if (existing) {
    console.log('Already seeded; skipping. To start over, run pnpm db:reset.');
    return;
  }

  const accounts = await seedAccounts();

  // Everything else lands together or not at all.
  await db.transaction(async (tx) => {
    const ctx = {
      tx,
      accounts,
      barangays: new Map(
        (await tx.select().from(barangay)).map((b) => [b.name, b]),
      ),
      incidentTypes: new Map(
        (await tx.select().from(incidentType)).map((t) => [t.code, t]),
      ),
      agencies: new Map(
        (await tx.select().from(agency)).map((a) => [a.name, a.id]),
      ),
    };
    const residents = await seedResidents(ctx);
    const reports = await seedReports(ctx, residents);
    await seedBroadcasts(ctx, residents);
    await seedInfo(ctx);
    await seedInvites(ctx);
    console.log(
      `Seeded ${Object.keys(residents).length} residents and ${Object.keys(reports).length} reports, plus one escalated from a survey, with broadcasts, hotlines, knowledge-base entries and invites.`,
    );
  });

  console.log(
    `Sign in as admin@migo.local, responder@migo.local or golez@migo.local (password ${SEED_PASSWORD}).`,
  );
}

try {
  await seed();
} finally {
  await pool.end();
}
