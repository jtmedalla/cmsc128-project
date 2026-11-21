/**
 * Sample reports for dashboard development. Run with `pnpm --filter api
 * db:seed` after migrating. Skips if it already ran on this database.
 */
import type {
  ParseConfidence,
  ReportStatus,
  SeverityLevel,
  VictimInput,
} from '@repo/shared';
import { and, eq, inArray, like } from 'drizzle-orm';
import { env } from '../config/env.js';
import { IntakeRepository } from '../intake/intake.repository.js';
import { db, pool } from './client.js';
import {
  barangay,
  broadcast,
  incidentType,
  message,
  report,
  resident,
  residentChannel,
  user,
} from './schema/index.js';

const SEED_PREFIX = 'seed-';

const advisorySeeds = [
  {
    messageBody:
      'Residents in high-risk zones are advised to prepare for possible evacuation. Keep communication lines open, assist vulnerable household members, and follow barangay teams for updates.',
    minutesAgo: 3,
    targetHazard: 'fire' as const,
  },
  {
    messageBody:
      'Road monitoring in progress. Expect rerouting along main thoroughfares. Stay tuned for updates.',
    minutesAgo: 24,
    targetHazard: 'flood' as const,
  },
  {
    messageBody:
      'Report injuries and urgent medical concerns to the barangay health officer immediately.',
    minutesAgo: 36,
    targetHazard: 'earthquake' as const,
  },
  {
    messageBody:
      'Stockpile clean drinking water and non-perishable food for at least three days. Coordinate with barangay captains.',
    minutesAgo: 58,
    targetHazard: 'storm_surge' as const,
  },
  {
    messageBody:
      'Stay away from unstable slopes and riverbanks. Move to higher ground when ordered and follow official evacuation instructions.',
    minutesAgo: 180,
    targetHazard: 'landslide' as const,
  },
];

interface Sample {
  resident: string | null;
  body: string;
  incidentType: string | null;
  severity: SeverityLevel | null;
  barangay: string | null;
  status: ReportStatus;
  minutesAgo: number;
  isProxy?: boolean;
  victims?: VictimInput[];
  confidence?: ParseConfidence;
}

const samples: Sample[] = [
  {
    resident: 'Maria Santos',
    body: 'Sunog sa balay sang amon kaingod sa Tacas, palihog bulig!',
    incidentType: 'fire',
    severity: 'critical',
    barangay: 'Tacas',
    status: 'pending',
    minutesAgo: 3,
    isProxy: true,
    confidence: { incidentType: 0.97, severity: 0.88, barangay: 0.95 },
  },
  {
    resident: null,
    body: 'Baha na diri sa Baybay Sur, abot tuhod na ang tubig',
    incidentType: 'flood',
    severity: 'high',
    barangay: 'Baybay Sur',
    status: 'pending',
    minutesAgo: 12,
    confidence: { incidentType: 0.93, severity: 0.61, barangay: 0.9 },
  },
  {
    resident: 'Jose Ramos',
    body: 'May naaksidente nga motor sa highway malapit sa Kirayan Norte',
    incidentType: 'accident',
    severity: 'high',
    barangay: 'Kirayan Norte',
    status: 'validated',
    minutesAgo: 25,
    isProxy: true,
    victims: [
      { sex: 'male', ageMin: 24, ageMax: 24, medicalCondition: 'Head injury' },
      { sex: 'male', ageMin: 30, ageMax: 39 },
    ],
    confidence: { incidentType: 0.95, severity: 0.8, barangay: 0.86 },
  },
  {
    resident: 'Ana Villanueva',
    body: 'Ang lola ko ginahapos, indi makaginhawa sang maayo',
    incidentType: 'medical',
    severity: 'moderate',
    barangay: 'Sapa',
    status: 'dispatched',
    minutesAgo: 48,
    isProxy: true,
    victims: [
      { sex: 'female', ageMin: 60, ageMax: null, medicalCondition: 'Asthma' },
    ],
    confidence: { incidentType: 0.9, severity: 0.55, barangay: 0.4 },
  },
  {
    resident: null,
    body: 'nagdalusdos ang duta sa dalan pakadto Igtuba',
    incidentType: 'landslide',
    severity: 'moderate',
    barangay: 'Igtuba',
    status: 'resolved',
    minutesAgo: 180,
    confidence: { incidentType: 0.84, severity: 0.5, barangay: 0.92 },
  },
  {
    resident: 'Pedro Cruz',
    body: 'tulong',
    incidentType: null,
    severity: null,
    barangay: null,
    status: 'pending',
    minutesAgo: 6,
  },
  {
    resident: null,
    body: 'test lang ni',
    incidentType: 'other',
    severity: 'low',
    barangay: 'Mat-y',
    status: 'invalid',
    minutesAgo: 300,
    confidence: { incidentType: 0.3, severity: 0.2 },
  },
  {
    resident: 'Liza Gomez',
    body: 'Gin-evacuate na kami sa eskwelahan sa Ubos Ilawod',
    incidentType: 'evacuation',
    severity: 'low',
    barangay: 'Ubos Ilawod',
    status: 'closed',
    minutesAgo: 1440,
    confidence: { incidentType: 0.89, severity: 0.7, barangay: 0.94 },
  },
];

async function seedAdvisories() {
  const [existing] = await db
    .select({ id: broadcast.id })
    .from(broadcast)
    .where(
      inArray(
        broadcast.messageBody,
        advisorySeeds.map((advisory) => advisory.messageBody),
      ),
    )
    .limit(1);
  if (existing) {
    console.log('Sample advisories already seeded; skipping.');
    return;
  }

  const [creator] = await db.select({ id: user.id }).from(user).limit(1);
  if (!creator) {
    console.log('No responder account found; skipping advisories.');
    return;
  }

  const now = Date.now();
  await db.insert(broadcast).values(
    advisorySeeds.map((advisory) => {
      const sentAt = new Date(now - advisory.minutesAgo * 60_000);
      return {
        createdBy: creator.id,
        kind: 'advisory' as const,
        messageBody: advisory.messageBody,
        targetBarangayIds: [],
        targetHazard: advisory.targetHazard,
        sentAt,
        createdAt: sentAt,
      };
    }),
  );
  console.log(`Seeded ${advisorySeeds.length} sample advisories.`);
}

async function seed() {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed sample reports in production');
  }

  await seedAdvisories();

  const [existing] = await db
    .select({ id: residentChannel.id })
    .from(residentChannel)
    .where(
      and(
        eq(residentChannel.channel, 'web'),
        like(residentChannel.externalId, `${SEED_PREFIX}%`),
      ),
    )
    .limit(1);
  if (existing) {
    console.log('Sample reports already seeded; skipping.');
    return;
  }

  const types = new Map(
    (await db.select().from(incidentType)).map((t) => [t.code, t]),
  );
  const barangays = new Map(
    (await db.select().from(barangay)).map((b) => [b.name, b]),
  );

  for (const [i, sample] of samples.entries()) {
    const createdAt = new Date(Date.now() - sample.minutesAgo * 60_000);
    const place = sample.barangay ? barangays.get(sample.barangay) : undefined;
    if (sample.barangay && !place) {
      throw new Error(`Unknown barangay ${sample.barangay}`);
    }

    const [person] = await db
      .insert(resident)
      .values({
        name: sample.resident,
        // Fake but well-formed PH mobile numbers, unique per sample.
        contactNumber: `0917000${String(i).padStart(4, '0')}`,
        createdAt,
      })
      .returning({ id: resident.id });
    await db.insert(residentChannel).values({
      residentId: person!.id,
      channel: 'web',
      externalId: `${SEED_PREFIX}${i}`,
      lastInboundAt: createdAt,
    });
    const [raw] = await db
      .insert(message)
      .values({
        residentId: person!.id,
        channel: 'web',
        direction: 'inbound',
        body: sample.body,
        createdAt,
      })
      .returning({ id: message.id });

    const { id } = await new IntakeRepository(db).insertReport({
      residentId: person!.id,
      sourceChannel: 'web',
      isProxy: sample.isProxy,
      incidentTypeId: sample.incidentType
        ? types.get(sample.incidentType)?.id
        : null,
      severity: sample.severity,
      barangayId: place?.id,
      locationText: place?.name,
      location: place?.centroid,
      incidentAt: createdAt,
      victims: sample.victims,
      messageIds: [raw!.id],
      parsedAutomatically: Boolean(sample.confidence),
      parseConfidence: sample.confidence,
    });
    // Intake only creates pending reports; backdate and advance them here.
    await db
      .update(report)
      .set({ status: sample.status, createdAt })
      .where(eq(report.id, id));
  }

  console.log(`Seeded ${samples.length} sample reports.`);
}

try {
  await seed();
} finally {
  await pool.end();
}
