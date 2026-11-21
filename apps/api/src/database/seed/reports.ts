import {
  ANYONE_HURT_LABELS,
  type AnyoneHurt,
  type ParseConfidence,
  type ReportStatus,
  SEVERITY_LABELS,
  type SeverityLevel,
  SEX_LABELS,
  type VictimInput,
} from '@repo/shared';
import { eq, inArray } from 'drizzle-orm';
import { IntakeRepository } from '../../intake/intake.repository.js';
import { db } from '../client.js';
import {
  agencyReferral,
  message,
  report,
  reportEdit,
  victim,
} from '../schema/index.js';
import {
  ago,
  barangayOf,
  later,
  pointIn,
  SEED_PREFIX,
  type SeedContext,
} from './context.js';
import type { ResidentKey, SeededResident } from './residents.js';

/** The bot's replies, as `chat-intake.service.ts` and `questions.ts` word them. */
const BOT = {
  received: 'We received your report. MDRRMO responders can see it now.',
  done: 'Thank you. Responders have your report and may call you for details.',
  incidentType: 'What happened?',
  barangay: 'Which barangay is it in?',
  severity: 'How serious is it?',
  anyoneHurt: 'Is anyone hurt?',
  firstVictim:
    "We'll ask a few quick questions about each person who's hurt. No names needed. Is the person male or female?",
  nextVictim: 'Is the next person male or female?',
  age: 'About how old are they? Tap a group, or type an age like 45.',
  condition: 'How are they hurt? Tap one, or describe it.',
  another: 'Thank you. Is anyone else hurt?',
};

interface ReportSeed {
  key: string;
  /** A resident, or `hotline` for a call a responder logged on the dashboard. */
  from: ResidentKey | 'hotline';
  /** The first message, or the responder's notes for a hotline call. */
  body: string;
  type: string | null;
  severity: SeverityLevel | null;
  barangay: string | null;
  status: ReportStatus;
  at: { days?: number; hours?: number; minutes?: number };
  isProxy?: boolean;
  anyoneHurt?: AnyoneHurt;
  victims?: VictimInput[];
  /** Set when the classifier parsed the first message. */
  confidence?: ParseConfidence;
  /** The resident shared a map pin right after their first message. */
  sharesLocation?: boolean;
  /** Where it is, in the reporter's words. Defaults to the barangay. */
  locationText?: string;
  /** Messages the resident sent after the intake questions. */
  followUps?: string[];
  /** A responder's reply in the chat. */
  reply?: string;
  duplicateOf?: string;
  /** Fields a responder corrected, recorded in `report_edit`. */
  corrections?: { field: string; from: unknown; to: unknown }[];
}

/**
 * Reports over the last 30 days: every status, incident type and severity,
 * with proxies, victims, hotline calls, a duplicate and an abandoned report.
 */
const reports: ReportSeed[] = [
  {
    key: 'fireTacas',
    from: 'maria',
    body: 'Sunog sa balay sang amon kaingod sa Tacas, palihog bulig!',
    type: 'fire',
    severity: 'critical',
    barangay: 'Tacas',
    status: 'pending',
    at: { minutes: 3 },
    isProxy: true,
    anyoneHurt: 'unknown',
    confidence: { incidentType: 0.97, severity: 0.88, barangay: 0.95 },
    sharesLocation: true,
  },
  {
    key: 'tulong',
    from: 'pedro',
    body: 'tulong',
    type: null,
    severity: null,
    barangay: null,
    status: 'pending',
    at: { minutes: 6 },
  },
  {
    key: 'floodBaybay',
    from: 'grace',
    body: 'Baha na dito sa Baybay Sur, hanggang tuhod na ang tubig sa kalsada',
    type: 'flood',
    severity: 'high',
    barangay: 'Baybay Sur',
    status: 'pending',
    at: { minutes: 12 },
    anyoneHurt: 'no',
    confidence: { incidentType: 0.93, severity: 0.61, barangay: 0.9 },
  },
  {
    key: 'floodBaybayAgain',
    from: 'unnamed',
    body: 'Grabe na ang baha sa Baybay Sur, indi na makaagi ang mga salakyan',
    type: 'flood',
    severity: 'high',
    barangay: 'Baybay Sur',
    status: 'invalid',
    at: { minutes: 9 },
    anyoneHurt: 'no',
    confidence: { incidentType: 0.91, severity: 0.7, barangay: 0.93 },
    duplicateOf: 'floodBaybay',
  },
  {
    key: 'landslideCabunotan',
    from: 'unnamed',
    body: 'May guho sa bukid sa Cabunotan, may balay nga natabunan',
    type: 'landslide',
    severity: 'critical',
    barangay: 'Cabunotan',
    status: 'pending',
    at: { hours: 2 },
    anyoneHurt: 'unknown',
    confidence: { incidentType: 0.88, severity: 0.82, barangay: 0.9 },
    sharesLocation: true,
  },
  {
    key: 'accidentKirayan',
    from: 'jose',
    body: 'May naaksidente nga motor sa highway malapit sa Kirayan Norte',
    type: 'accident',
    severity: 'high',
    barangay: 'Kirayan Norte',
    status: 'validated',
    at: { minutes: 25 },
    isProxy: true,
    anyoneHurt: 'yes',
    victims: [
      { sex: 'male', ageMin: 24, ageMax: 24, medicalCondition: 'Head injury' },
      { sex: 'male', ageMin: 18, ageMax: 59, medicalCondition: 'Bruises' },
    ],
    confidence: { incidentType: 0.95, severity: 0.66, barangay: 0.86 },
    locationText: 'National highway, near the waiting shed',
    followUps: ['Ara pa sila sa dalan, wala pa ambulansya'],
    reply:
      'Paabot na ang ambulansya halin sa RHU. Palihog indi pag-ibalhin ang pasyente.',
    corrections: [{ field: 'severity', from: 'moderate', to: 'high' }],
  },
  {
    key: 'medicalSapa',
    from: 'ana',
    body: 'Ang lola ko ginahapos, indi makaginhawa sang maayo',
    type: 'medical',
    severity: 'moderate',
    barangay: 'Sapa',
    status: 'dispatched',
    at: { minutes: 48 },
    isProxy: true,
    anyoneHurt: 'yes',
    victims: [
      { sex: 'female', ageMin: 60, ageMax: null, medicalCondition: 'Asthma' },
    ],
    confidence: { incidentType: 0.9, severity: 0.55, barangay: 0.4 },
    reply: 'Ari na ang rescue team. Ihanda ang iya bulong kag ID.',
  },
  {
    key: 'fireUbosIlaya',
    from: 'hotline',
    body: 'Caller on the office hotline: grass fire spreading toward houses behind the public market.',
    type: 'fire',
    severity: 'high',
    barangay: 'Ubos Ilaya',
    status: 'dispatched',
    at: { hours: 20 },
    anyoneHurt: 'no',
    locationText: 'Behind the public market',
  },
  {
    key: 'evacBacauan',
    from: 'nestor',
    body: 'Taas ang balod, gin-evacuate na namon ang 15 ka pamilya sa barangay hall',
    type: 'evacuation',
    severity: 'critical',
    barangay: 'Bacauan',
    status: 'dispatched',
    at: { days: 2 },
    anyoneHurt: 'no',
    confidence: { incidentType: 0.86, severity: 0.79, barangay: 0.97 },
    locationText: 'Barangay hall',
    followUps: ['Kinahanglan namon tubig kag pagkaon para sa mga bata'],
    reply:
      'Nagpadala na ang MSWDO sang relief packs. Abot sa sulod sang 2 oras.',
  },
  {
    key: 'accidentDamilisan',
    from: 'elena',
    body: 'May nabanggaan nga bata sa coastal road sa Damilisan',
    type: 'accident',
    severity: 'moderate',
    barangay: 'Damilisan',
    status: 'validated',
    at: { days: 2, hours: 3 },
    isProxy: true,
    anyoneHurt: 'yes',
    victims: [
      { sex: 'male', ageMin: 8, ageMax: 8, medicalCondition: 'Leg wound' },
    ],
    confidence: { incidentType: 0.92, severity: 0.7, barangay: 0.95 },
    corrections: [{ field: 'barangay', from: 'Dingle', to: 'Damilisan' }],
  },
  {
    key: 'landslideIgtuba',
    from: 'ramon',
    body: 'Nagdalusdos ang duta sa dalan pakadto Igtuba, indi makaagi ang tricycle',
    type: 'landslide',
    severity: 'moderate',
    barangay: 'Igtuba',
    status: 'resolved',
    at: { days: 3 },
    anyoneHurt: 'no',
    confidence: { incidentType: 0.84, severity: 0.5, barangay: 0.92 },
    sharesLocation: true,
  },
  {
    key: 'evacUbosIlawod',
    from: 'liza',
    body: 'Gin-evacuate kami sa eskwelahan sa Ubos Ilawod, mga 20 ka pamilya',
    type: 'evacuation',
    severity: 'low',
    barangay: 'Ubos Ilawod',
    status: 'closed',
    at: { days: 6 },
    anyoneHurt: 'no',
    confidence: { incidentType: 0.89, severity: 0.7, barangay: 0.94 },
  },
  {
    key: 'medicalBolho',
    from: 'hotline',
    body: 'Walk-in at the office: a farmer cut his hand with a bolo; brought to the RHU.',
    type: 'medical',
    severity: 'moderate',
    barangay: 'Bolho',
    status: 'resolved',
    at: { days: 7 },
    anyoneHurt: 'yes',
    victims: [
      { sex: 'male', ageMin: 40, ageMax: 49, medicalCondition: 'Deep cut' },
    ],
  },
  {
    key: 'earthquakeMaty',
    from: 'mark',
    body: 'Strong shaking near the UPV gate. There are cracks on our boarding house wall and everyone is outside now.',
    type: 'earthquake',
    severity: 'moderate',
    barangay: 'Mat-y',
    status: 'resolved',
    at: { days: 9 },
    anyoneHurt: 'no',
    confidence: { incidentType: 0.96, severity: 0.72, barangay: 0.81 },
  },
  {
    key: 'testMaty',
    from: 'mark',
    body: 'testing if this works hehe',
    type: 'other',
    severity: 'low',
    barangay: 'Mat-y',
    status: 'invalid',
    at: { days: 9, hours: 2 },
    confidence: { incidentType: 0.3, severity: 0.2 },
  },
  {
    key: 'medicalTumagboc',
    from: 'rosalinda',
    body: 'Ang bana ko nagkadulog, indi makahambal kag indi makahulag ang wala nga kamot',
    type: 'medical',
    severity: 'critical',
    barangay: 'Tumagboc',
    status: 'closed',
    at: { days: 12 },
    isProxy: true,
    anyoneHurt: 'yes',
    victims: [
      {
        sex: 'male',
        ageMin: 60,
        ageMax: null,
        medicalCondition: 'Possible stroke',
      },
    ],
    confidence: { incidentType: 0.87, severity: 0.9, barangay: 0.6 },
    reply: 'Ginpadala na ang ambulansya. Ipahigda siya kag indi pagpainuma.',
  },
  {
    key: 'floodKirayanSur',
    from: 'joy',
    body: 'Nagsulod ang tubig sa amon balay, abot tuhod na sa fish landing',
    type: 'flood',
    severity: 'moderate',
    barangay: 'Kirayan Sur',
    status: 'resolved',
    at: { days: 15 },
    anyoneHurt: 'no',
    confidence: { incidentType: 0.94, severity: 0.68, barangay: 0.88 },
  },
  {
    key: 'fireIgbita',
    from: 'carlo',
    body: 'May sunog sa kubo malapit sa water tank, kumakalat na sa damuhan',
    type: 'fire',
    severity: 'high',
    barangay: 'Igbita',
    status: 'resolved',
    at: { days: 20 },
    anyoneHurt: 'yes',
    victims: [
      {
        sex: 'male',
        ageMin: 18,
        ageMax: 59,
        medicalCondition: 'Burns on the arm',
      },
    ],
    confidence: { incidentType: 0.98, severity: 0.84, barangay: 0.91 },
    corrections: [{ field: 'severity', from: 'critical', to: 'high' }],
  },
  {
    key: 'otherTigbagacay',
    from: 'nestor',
    body: 'Natumba ang poste sang kuryente sa dalan pakadto Tigbagacay, delikado sa mga nagaagi',
    type: 'other',
    severity: 'moderate',
    barangay: 'Tigbagacay',
    status: 'closed',
    at: { days: 27 },
    anyoneHurt: 'no',
    confidence: { incidentType: 0.62, severity: 0.66, barangay: 0.95 },
  },
];

/** Agencies a responder refers each kind of incident to. */
const REFERRALS: Record<string, string[]> = {
  fire: ['BFP'],
  medical: ['RHU'],
  accident: ['PNP', 'RHU'],
  flood: ['MSWDO'],
  evacuation: ['MSWDO'],
  landslide: ['OCD'],
  earthquake: ['OCD'],
};

/** How a report reached its status, one `report_edit` per step. */
const STATUS_PATH: Record<ReportStatus, ReportStatus[]> = {
  pending: [],
  invalid: ['invalid'],
  validated: ['validated'],
  dispatched: ['validated', 'dispatched'],
  resolved: ['validated', 'dispatched', 'resolved'],
  closed: ['validated', 'dispatched', 'resolved', 'closed'],
};

interface Turn {
  from: 'resident' | 'bot' | 'responder';
  body: string | null;
  attachments?: unknown[];
}

/**
 * The conversation intake would have had: the bot asks only for what the
 * classifier didn't parse confidently, then walks through each victim.
 */
function conversation(
  r: ReportSeed,
  ctx: SeedContext,
  pin: { lng: number; lat: number } | null,
): Turn[] {
  const turns: Turn[] = [{ from: 'resident', body: r.body }];
  if (pin) {
    turns.push({
      from: 'resident',
      body: null,
      attachments: [{ type: 'location', ...pin }],
    });
  }
  turns.push({ from: 'bot', body: BOT.received });

  const sure = (field: keyof ParseConfidence) =>
    (r.confidence?.[field] ?? 0) >= 0.75;
  const answers: [boolean, string, string | null][] = [
    [
      sure('incidentType'),
      BOT.incidentType,
      r.type ? ctx.incidentTypes.get(r.type)!.name : null,
    ],
    [sure('barangay'), BOT.barangay, r.barangay],
    [
      sure('severity'),
      BOT.severity,
      r.severity ? SEVERITY_LABELS[r.severity] : null,
    ],
    [
      false,
      BOT.anyoneHurt,
      r.anyoneHurt ? ANYONE_HURT_LABELS[r.anyoneHurt] : null,
    ],
  ];
  for (const [known, ask, answer] of answers) {
    if (known) continue;
    turns.push({ from: 'bot', body: ask });
    // A resident who stops answering leaves the report half-filled.
    if (answer === null) return turns;
    turns.push({ from: 'resident', body: answer });
  }

  for (const [i, v] of (r.victims ?? []).entries()) {
    turns.push(
      { from: 'bot', body: i === 0 ? BOT.firstVictim : BOT.nextVictim },
      { from: 'resident', body: v.sex ? SEX_LABELS[v.sex] : "Don't know" },
      { from: 'bot', body: BOT.age },
      {
        from: 'resident',
        body:
          v.ageMin === v.ageMax
            ? String(v.ageMin)
            : v.ageMin! >= 60
              ? 'Senior'
              : 'Adult',
      },
      { from: 'bot', body: BOT.condition },
      { from: 'resident', body: v.medicalCondition ?? "Don't know" },
      { from: 'bot', body: BOT.another },
      { from: 'resident', body: i === r.victims!.length - 1 ? 'No' : 'Yes' },
    );
  }

  turns.push({ from: 'bot', body: BOT.done });
  for (const body of r.followUps ?? []) turns.push({ from: 'resident', body });
  if (r.reply) turns.push({ from: 'responder', body: r.reply });
  return turns;
}

/** Inserts the reports with their conversations, history and referrals. */
export async function seedReports(
  ctx: SeedContext,
  residents: Record<ResidentKey, SeededResident>,
): Promise<Record<string, string>> {
  const intake = new IntakeRepository(db);
  const ids: Record<string, string> = {};

  for (const [i, r] of reports.entries()) {
    const createdAt = ago(r.at);
    const place = r.barangay ? barangayOf(ctx, r.barangay) : null;
    const location = r.barangay ? await pointIn(ctx, r.barangay, i) : null;
    const handler = i % 3 === 0 ? ctx.accounts.golez : ctx.accounts.responder;
    const fields = {
      isProxy: r.isProxy ?? false,
      incidentTypeId: r.type ? ctx.incidentTypes.get(r.type)!.id : null,
      severity: r.severity,
      anyoneHurt: r.anyoneHurt ?? null,
      barangayId: place?.id ?? null,
      locationText: r.locationText ?? r.barangay,
      location,
      incidentAt: createdAt,
    };

    let id: string;
    let lastActivity = createdAt;
    if (r.from === 'hotline') {
      const [row] = await ctx.tx
        .insert(report)
        .values({ ...fields, sourceChannel: 'dashboard', createdBy: handler })
        .returning({ id: report.id });
      id = row!.id;
      if (r.victims?.length) {
        await ctx.tx
          .insert(victim)
          .values(r.victims.map((v) => ({ ...v, reportId: id })));
      }
    } else {
      const who = residents[r.from];
      const turns = conversation(r, ctx, r.sharesLocation ? location : null);
      const rows = turns.map((turn, n) => ({
        residentId: who.id,
        channel: who.channel,
        direction:
          turn.from === 'resident'
            ? ('inbound' as const)
            : ('outbound' as const),
        senderId: turn.from === 'responder' ? handler : null,
        body: turn.body,
        attachments: turn.attachments ?? null,
        // Messenger message IDs; web chat has none.
        externalId:
          who.channel === 'messenger' && turn.from === 'resident'
            ? `${SEED_PREFIX}mid-${i}-${n}`
            : null,
        // Replies come quickly; a responder's takes a few minutes.
        createdAt: later(
          createdAt,
          turn.from === 'responder' ? n + 4 : n * 0.5,
        ),
      }));
      const [first, ...rest] = await ctx.tx
        .insert(message)
        .values(rows)
        .returning({ id: message.id });
      ({ id } = await intake.insertReport(
        {
          ...fields,
          residentId: who.id,
          sourceChannel: who.channel,
          victims: r.victims,
          messageIds: [first!.id],
          parsedAutomatically: Boolean(r.confidence),
          parseConfidence: r.confidence,
        },
        ctx.tx,
      ));
      // Intake linked the first message; the rest of the thread follows it.
      if (rest.length) {
        await ctx.tx
          .update(message)
          .set({ reportId: id })
          .where(
            inArray(
              message.id,
              rest.map((row) => row.id),
            ),
          );
      }
      lastActivity = rows.at(-1)!.createdAt;
    }
    ids[r.key] = id;

    // A responder reviews it a few minutes in, then moves it along.
    const history = [
      ...(r.corrections ?? []),
      ...STATUS_PATH[r.status].map((to, n, path) => ({
        field: 'status',
        from: n === 0 ? 'pending' : path[n - 1],
        to,
      })),
    ].map((edit, n) => ({
      reportId: id,
      responderId: handler,
      field: edit.field,
      oldValue: edit.from,
      newValue: edit.to,
      editedAt: later(createdAt, 5 + n * 20),
    }));
    if (history.length) {
      await ctx.tx.insert(reportEdit).values(history);
      lastActivity = history.at(-1)!.editedAt;
    }

    const referred = ['dispatched', 'resolved', 'closed'].includes(r.status);
    if (referred && r.type && REFERRALS[r.type]) {
      await ctx.tx.insert(agencyReferral).values(
        REFERRALS[r.type]!.map((name) => ({
          reportId: id,
          agencyId: ctx.agencies.get(name)!,
          referredBy: handler,
          referredAt: later(createdAt, 30),
        })),
      );
    }

    // Intake only writes pending reports at insert time; backdate and advance.
    await ctx.tx
      .update(report)
      .set({
        status: r.status,
        reviewedBy: r.status === 'pending' ? null : handler,
        duplicateOfId: r.duplicateOf ? ids[r.duplicateOf] : null,
        createdAt,
        updatedAt: lastActivity,
      })
      .where(eq(report.id, id));
  }
  return ids;
}
