import { eq } from 'drizzle-orm';
import { agency, knowledgeEntry } from '../schema/index.js';
import type { SeedContext } from './context.js';

/**
 * Hotlines for the agencies seeded by migration. Fake, well-formed numbers:
 * get the real ones from MDRRMO before showing them to residents.
 */
const hotlines: Record<string, { contactNumber: string; isPublic: boolean }> = {
  BFP: { contactNumber: '(033) 000-0101', isPublic: true },
  PNP: { contactNumber: '(033) 000-0102', isPublic: true },
  RHU: { contactNumber: '(033) 000-0103', isPublic: true },
  MSWDO: { contactNumber: '(033) 000-0104', isPublic: true },
  MHO: { contactNumber: '(033) 000-0105', isPublic: false },
  OCD: { contactNumber: '(033) 000-0106', isPublic: false },
};

const entries = [
  {
    title: 'Office hours and location',
    body: 'MDRRMO Miagao is at the Municipal Hall. The operations center answers calls 24 hours a day; the office is open Monday to Friday, 8 AM to 5 PM.',
    language: 'eng' as const,
  },
  {
    title: 'Ano ang dapat sulod sang go-bag?',
    body: 'Tubig para sa 3 ka adlaw, pagkaon nga indi madali madulot, flashlight, radyo, bulong, kopya sang ID kag mga dokumento, kag ekstra nga bayo.',
    language: 'hil' as const,
  },
  {
    title: 'Paano malalaman ang status ng report ko?',
    body: 'Pagkatapos mag-report, makakatanggap ka ng link. Buksan ito para makita kung pending, validated, dispatched o resolved na ang report mo. Hindi kailangang mag-login.',
    language: 'tgl' as const,
  },
  {
    title: 'Ano ang i-report sa MIGO?',
    body: 'Sunog, baha, aksidente, guho, linog, kag sin-o man nga nagakinahanglan medikal nga bulig. Kon delikado gid, tawagi man ang hotline.',
    language: 'hil' as const,
  },
];

/** Fills agency hotlines and the knowledge base the info pages read. */
export async function seedInfo(ctx: SeedContext) {
  for (const [name, hotline] of Object.entries(hotlines)) {
    await ctx.tx.update(agency).set(hotline).where(eq(agency.name, name));
  }
  await ctx.tx
    .insert(knowledgeEntry)
    .values(entries.map((e) => ({ ...e, updatedBy: ctx.accounts.admin })));
}
