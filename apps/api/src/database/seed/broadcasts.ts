import type { DeliveryStatus, HazardType } from '@repo/shared';
import { eq } from 'drizzle-orm';
import { IntakeRepository } from '../../intake/intake.repository.js';
import { db } from '../client.js';
import {
  broadcast,
  broadcastDelivery,
  broadcastOption,
  broadcastResponse,
  report,
} from '../schema/index.js';
import { ago, barangayOf, later, type SeedContext } from './context.js';
import type { ResidentKey, SeededResident } from './residents.js';

/** Meta's standard messaging window after a resident's last message. */
const WINDOW_MS = 24 * 60 * 60_000;

interface AdvisorySeed {
  body: string;
  hazard: HazardType | null;
  /** Hours ago it went out; null for a draft. */
  sentHoursAgo: number | null;
  /** Targeted barangays; empty for the whole municipality. */
  target: 'all' | 'coastal' | 'upland';
}

const advisories: AdvisorySeed[] = [
  {
    body: 'Residents in high-risk zones are advised to prepare for possible evacuation. Keep communication lines open, assist vulnerable household members, and follow barangay teams for updates.',
    hazard: 'fire',
    sentHoursAgo: 0.05,
    target: 'all',
  },
  {
    body: 'Road monitoring in progress. Expect rerouting along main thoroughfares. Stay tuned for updates.',
    hazard: 'flood',
    sentHoursAgo: 0.4,
    target: 'all',
  },
  {
    body: 'Report injuries and urgent medical concerns to the barangay health officer immediately.',
    hazard: 'earthquake',
    sentHoursAgo: 0.6,
    target: 'all',
  },
  {
    body: 'Stockpile clean drinking water and non-perishable food for at least three days. Coordinate with barangay captains.',
    hazard: 'storm_surge',
    sentHoursAgo: 1,
    target: 'all',
  },
  {
    body: 'Stay away from unstable slopes and riverbanks. Move to higher ground when ordered and follow official evacuation instructions.',
    hazard: 'landslide',
    sentHoursAgo: 3,
    target: 'all',
  },
  {
    body: 'Gale warning: big waves expected along the Miagao coast tonight. Fishers, do not go out to sea. Secure your boats and move away from the shoreline.',
    hazard: 'storm_surge',
    sentHoursAgo: 26,
    target: 'coastal',
  },
  {
    body: 'Heavy rain in the uplands over the next 48 hours. Watch for cracks on slopes and be ready to evacuate to your barangay hall.',
    hazard: 'landslide',
    sentHoursAgo: 96,
    target: 'upland',
  },
  {
    body: 'Libreng bakuna kontra rabies sa Sabado sa plaza, 8 AM hasta 12 PM.',
    hazard: null,
    sentHoursAgo: null,
    target: 'all',
  },
];

const survey = {
  body: 'Kumusta kamo pagkatapos sang baha? I-tap ang isa para mahibal-an sang MDRRMO kon sin-o ang nagakinahanglan bulig.',
  hazard: 'flood' as const,
  sentHoursAgo: 30,
  barangays: ['Baybay Sur', 'Kirayan Norte', 'Kirayan Sur', 'Sapa', 'Tacas'],
  options: ['Safe kami', 'Kinahanglan namon bulig', 'Nag-evacuate na kami'],
  /** Who answered, by option index. */
  responses: { maria: 0, ana: 2, jose: 1 } as Partial<
    Record<ResidentKey, number>
  >,
  /** The "need help" answer a responder turned into a report. */
  escalate: 'jose' as ResidentKey,
};

function targetIds(ctx: SeedContext, target: AdvisorySeed['target']) {
  if (target === 'all') return [];
  return [...ctx.barangays.values()]
    .filter((b) => (target === 'coastal' ? b.isCoastal : b.isUpland))
    .map((b) => b.id);
}

/**
 * Who a broadcast reaches: opted-in Messenger residents in the target area.
 * Web chat residents can't be messaged until Web Push lands.
 */
function recipients(
  ctx: SeedContext,
  residents: Record<ResidentKey, SeededResident>,
  barangayIds: string[],
) {
  return Object.values(residents).filter(
    (r) =>
      r.channel === 'messenger' &&
      r.broadcastsOptIn &&
      (!barangayIds.length ||
        (r.barangay && barangayIds.includes(barangayOf(ctx, r.barangay).id))),
  );
}

function deliveryStatus(r: SeededResident, sentAt: Date): DeliveryStatus {
  // A resident who blocked the Page; Meta rejects the send.
  if (r.name === null) return 'failed';
  return sentAt.getTime() - r.lastInboundAt.getTime() > WINDOW_MS
    ? 'outside_window'
    : 'sent';
}

/** Inserts advisories, a draft and a survey with deliveries and responses. */
export async function seedBroadcasts(
  ctx: SeedContext,
  residents: Record<ResidentKey, SeededResident>,
) {
  const senders = [
    ctx.accounts.responder,
    ctx.accounts.admin,
    ctx.accounts.golez,
  ];

  for (const [i, a] of advisories.entries()) {
    const sentAt =
      a.sentHoursAgo === null ? null : ago({ minutes: a.sentHoursAgo * 60 });
    const barangayIds = targetIds(ctx, a.target);
    const [row] = await ctx.tx
      .insert(broadcast)
      .values({
        createdBy: senders[i % senders.length]!,
        kind: 'advisory',
        messageBody: a.body,
        targetBarangayIds: barangayIds,
        targetHazard: a.hazard,
        sentAt,
        createdAt: sentAt ?? ago({ hours: 1 }),
      })
      .returning({ id: broadcast.id });
    if (!sentAt) continue;

    const to = recipients(ctx, residents, barangayIds);
    if (to.length) {
      await ctx.tx.insert(broadcastDelivery).values(
        to.map((r) => {
          const status = deliveryStatus(r, sentAt);
          return {
            broadcastId: row!.id,
            residentId: r.id,
            channel: r.channel,
            status,
            sentAt: status === 'sent' ? later(sentAt, 1) : null,
          };
        }),
      );
    }
  }

  const sentAt = ago({ hours: survey.sentHoursAgo });
  const barangayIds = survey.barangays.map((name) => barangayOf(ctx, name).id);
  const [poll] = await ctx.tx
    .insert(broadcast)
    .values({
      createdBy: ctx.accounts.responder,
      kind: 'survey',
      messageBody: survey.body,
      targetBarangayIds: barangayIds,
      targetHazard: survey.hazard,
      respondBy: later(sentAt, 12 * 60),
      sentAt,
      createdAt: sentAt,
    })
    .returning({ id: broadcast.id });
  const options = await ctx.tx
    .insert(broadcastOption)
    .values(
      survey.options.map((label, displayOrder) => ({
        broadcastId: poll!.id,
        label,
        displayOrder,
      })),
    )
    .returning({ id: broadcastOption.id });

  const to = recipients(ctx, residents, barangayIds);
  await ctx.tx.insert(broadcastDelivery).values(
    to.map((r) => ({
      broadcastId: poll!.id,
      residentId: r.id,
      channel: r.channel,
      status: 'sent' as const,
      sentAt: later(sentAt, 1),
    })),
  );

  // A responder turns the "need help" answer into a report to act on.
  const asker = residents[survey.escalate];
  const { id: escalatedId } = await new IntakeRepository(db).insertReport(
    {
      residentId: asker.id,
      sourceChannel: asker.channel,
      incidentTypeId: ctx.incidentTypes.get('flood')!.id,
      severity: 'moderate',
      barangayId: barangayOf(ctx, asker.barangay!).id,
      locationText: asker.barangay,
      incidentAt: later(sentAt, 40),
    },
    ctx.tx,
  );
  await ctx.tx
    .update(report)
    .set({ createdAt: later(sentAt, 40), updatedAt: later(sentAt, 40) })
    .where(eq(report.id, escalatedId));

  await ctx.tx.insert(broadcastResponse).values(
    Object.entries(survey.responses).map(([key, option], n) => ({
      broadcastId: poll!.id,
      residentId: residents[key as ResidentKey].id,
      selectedOptionId: options[option]!.id,
      respondedAt: later(sentAt, 15 + n * 10),
      escalatedReportId: key === survey.escalate ? escalatedId : null,
    })),
  );
}
