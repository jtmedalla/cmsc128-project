import type { Language, Sex } from '@repo/shared';
import { resident, residentChannel } from '../schema/index.js';
import {
  ago,
  barangayOf,
  fakeMobile,
  pointIn,
  SEED_PREFIX,
  type SeedContext,
} from './context.js';

interface ResidentSeed {
  name: string | null;
  age: number | null;
  sex: Sex | null;
  barangay: string | null;
  /** Purok or landmark, as residents describe where they live. */
  address: string | null;
  language: Language;
  channel: 'messenger' | 'web';
  /** False for residents who never shared a number. */
  hasNumber: boolean;
  broadcastsOptIn?: boolean;
  /** Days since they last messaged; past Meta's window after a day. */
  lastMessagedDaysAgo: number;
}

/**
 * Residents across coastal, lowland and upland barangays and all four
 * languages. Some never finished their profile, like real first-time users.
 */
const residents = {
  maria: {
    name: 'Maria Santos',
    age: 42,
    sex: 'female',
    barangay: 'Tacas',
    address: 'Purok 3, near the chapel',
    language: 'hil',
    channel: 'messenger',
    hasNumber: true,
    lastMessagedDaysAgo: 0,
  },
  jose: {
    name: 'Jose Ramos',
    age: 35,
    sex: 'male',
    barangay: 'Kirayan Norte',
    address: 'Along the national highway',
    language: 'hil',
    channel: 'messenger',
    hasNumber: true,
    lastMessagedDaysAgo: 0,
  },
  ana: {
    name: 'Ana Villanueva',
    age: 29,
    sex: 'female',
    barangay: 'Sapa',
    address: 'Purok 1, beside the sari-sari store',
    language: 'hil',
    channel: 'messenger',
    hasNumber: true,
    lastMessagedDaysAgo: 1,
  },
  pedro: {
    name: 'Pedro Cruz',
    age: null,
    sex: null,
    barangay: null,
    address: null,
    language: 'hil',
    channel: 'messenger',
    hasNumber: false,
    lastMessagedDaysAgo: 0,
  },
  liza: {
    name: 'Liza Gomez',
    age: 51,
    sex: 'female',
    barangay: 'Ubos Ilawod',
    address: 'Near the elementary school',
    language: 'krj',
    channel: 'web',
    hasNumber: true,
    lastMessagedDaysAgo: 6,
  },
  ramon: {
    name: 'Ramon Dela Cruz',
    age: 63,
    sex: 'male',
    barangay: 'Igtuba',
    address: 'Sitio Bukid, upper road',
    language: 'krj',
    channel: 'messenger',
    hasNumber: true,
    lastMessagedDaysAgo: 3,
  },
  grace: {
    name: 'Grace Panes',
    age: 24,
    sex: 'female',
    barangay: 'Baybay Sur',
    address: 'Beachfront, Purok 5',
    language: 'tgl',
    channel: 'web',
    hasNumber: true,
    lastMessagedDaysAgo: 2,
  },
  mark: {
    name: 'Mark Anthony Lim',
    age: 19,
    sex: 'male',
    barangay: 'Mat-y',
    address: 'Boarding house near UPV gate',
    language: 'eng',
    channel: 'web',
    hasNumber: true,
    lastMessagedDaysAgo: 9,
  },
  rosalinda: {
    name: 'Rosalinda Tupas',
    age: 70,
    sex: 'female',
    barangay: 'Tumagboc',
    address: 'Sitio Lanag',
    language: 'krj',
    channel: 'messenger',
    hasNumber: true,
    lastMessagedDaysAgo: 12,
  },
  nestor: {
    name: 'Nestor Sumagaysay',
    age: 46,
    sex: 'male',
    barangay: 'Bacauan',
    address: 'Barangay hall',
    language: 'hil',
    channel: 'messenger',
    hasNumber: true,
    lastMessagedDaysAgo: 0,
  },
  unnamed: {
    name: null,
    age: null,
    sex: null,
    barangay: null,
    address: null,
    language: 'hil',
    channel: 'messenger',
    hasNumber: false,
    lastMessagedDaysAgo: 4,
  },
  joy: {
    name: 'Joy Villareal',
    age: 33,
    sex: 'female',
    barangay: 'Kirayan Sur',
    address: 'Purok 2, fish landing',
    language: 'hil',
    channel: 'messenger',
    hasNumber: true,
    broadcastsOptIn: false,
    lastMessagedDaysAgo: 15,
  },
  carlo: {
    name: 'Carlo Mendoza',
    age: 27,
    sex: 'male',
    barangay: 'Igbita',
    address: 'Near the water tank',
    language: 'tgl',
    channel: 'web',
    hasNumber: true,
    lastMessagedDaysAgo: 20,
  },
  elena: {
    name: 'Elena Pacheco',
    age: 58,
    sex: 'female',
    barangay: 'Damilisan',
    address: 'Coastal road, Purok 4',
    language: 'hil',
    channel: 'messenger',
    hasNumber: true,
    lastMessagedDaysAgo: 2,
  },
} satisfies Record<string, ResidentSeed>;

export type ResidentKey = keyof typeof residents;

export interface SeededResident {
  id: string;
  channel: 'messenger' | 'web';
  /** The resident's ID on their channel. */
  externalId: string;
  name: string | null;
  barangay: string | null;
  broadcastsOptIn: boolean;
  lastInboundAt: Date;
}

/** Inserts the residents with one chat identity each. */
export async function seedResidents(
  ctx: SeedContext,
): Promise<Record<ResidentKey, SeededResident>> {
  const seeded = {} as Record<ResidentKey, SeededResident>;
  const entries = Object.entries(residents) as [ResidentKey, ResidentSeed][];

  for (const [i, [key, r]] of entries.entries()) {
    const place = r.barangay ? barangayOf(ctx, r.barangay) : null;
    const lastInboundAt = ago({ days: r.lastMessagedDaysAgo, hours: 1 + i });
    const [row] = await ctx.tx
      .insert(resident)
      .values({
        name: r.name,
        contactNumber: r.hasNumber ? fakeMobile(100 + i) : null,
        age: r.age,
        sex: r.sex,
        barangayId: place?.id,
        locationText: r.address,
        location: r.barangay ? await pointIn(ctx, r.barangay, 100 + i) : null,
        languagePreference: r.language,
        broadcastsOptIn: r.broadcastsOptIn ?? true,
        privacyNoticeAt: ago({ days: 30 - i }),
        createdAt: ago({ days: 30 - i }),
      })
      .returning({ id: resident.id });

    const externalId = `${SEED_PREFIX}${r.channel}-${i}`;
    await ctx.tx.insert(residentChannel).values({
      residentId: row!.id,
      channel: r.channel,
      externalId,
      lastInboundAt,
    });

    seeded[key] = {
      id: row!.id,
      channel: r.channel,
      externalId,
      name: r.name,
      barangay: r.barangay,
      broadcastsOptIn: r.broadcastsOptIn ?? true,
      lastInboundAt,
    };
  }
  return seeded;
}
