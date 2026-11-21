import { createHash, randomBytes } from 'node:crypto';
import { invite } from '../schema/index.js';
import { ago, later, type SeedContext } from './context.js';

/** Invites store only a hash of their token, like the real flow will. */
const tokenHash = () =>
  createHash('sha256').update(randomBytes(32)).digest('hex');

/** One invite in each state the admin pages show. */
export async function seedInvites(ctx: SeedContext) {
  const sent = ago({ days: 10 });
  await ctx.tx.insert(invite).values([
    {
      // Accepted: how Juan Golez joined.
      email: 'golez@migo.local',
      role: 'responder',
      tokenHash: tokenHash(),
      invitedBy: ctx.accounts.admin,
      createdAt: sent,
      expiresAt: later(sent, 7 * 24 * 60),
      acceptedAt: later(sent, 90),
      acceptedUserId: ctx.accounts.golez,
    },
    {
      email: 'mdrrmo.staff@migo.local',
      role: 'responder',
      tokenHash: tokenHash(),
      invitedBy: ctx.accounts.admin,
      createdAt: ago({ days: 1 }),
      expiresAt: later(ago({ days: 1 }), 7 * 24 * 60),
    },
    {
      email: 'wrong.address@migo.local',
      role: 'responder',
      tokenHash: tokenHash(),
      invitedBy: ctx.accounts.admin,
      createdAt: ago({ days: 4 }),
      expiresAt: later(ago({ days: 4 }), 7 * 24 * 60),
      revokedAt: ago({ days: 4, hours: -1 }),
    },
    {
      email: 'it.technician@migo.local',
      role: 'admin',
      tokenHash: tokenHash(),
      invitedBy: ctx.accounts.admin,
      createdAt: ago({ days: 20 }),
      expiresAt: ago({ days: 13 }),
    },
  ]);
}
