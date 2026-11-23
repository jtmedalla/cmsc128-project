import { Inject, Injectable } from '@nestjs/common';
import type { IncidentType, IncidentTypeUpdate } from '@repo/shared';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import { incidentType, report, reportEdit } from '../database/schema/index.js';
import type { Executor } from '../database/transaction.js';

/** The outer row's ID, qualified: Drizzle drops table names in one-table selects. */
const typeId = sql`${incidentType}.${sql.identifier(incidentType.id.name)}`;

/**
 * Whether any report has the type, or any report correction names its ID as
 * the old or new value. `report_edit` values have no foreign key, so a type a
 * report was corrected away from counts too.
 */
const inUse = sql<boolean>`(
  exists (select 1 from ${report} r where r.incident_type_id = ${typeId})
  or exists (
    select 1 from ${reportEdit} e
    where e.old_value = to_jsonb(${typeId}::text)
      or e.new_value = to_jsonb(${typeId}::text)
  )
)`;

const columns = {
  id: incidentType.id,
  code: incidentType.code,
  name: incidentType.name,
  isActive: incidentType.isActive,
  inUse,
};

export type DeleteResult = 'deleted' | 'missing' | 'in_use';

@Injectable()
export class AdminRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Every incident type, retired ones included, by name. */
  findIncidentTypes(): Promise<IncidentType[]> {
    return this.db
      .select(columns)
      .from(incidentType)
      .orderBy(incidentType.name);
  }

  private async findIncidentType(
    id: string,
    tx: Executor = this.db,
  ): Promise<IncidentType | null> {
    const [row] = await tx
      .select(columns)
      .from(incidentType)
      .where(eq(incidentType.id, id));
    return row ?? null;
  }

  /** Adds a type; null when another type already has `code`. */
  async insertIncidentType(values: {
    code: string;
    name: string;
  }): Promise<IncidentType | null> {
    const [row] = await this.db
      .insert(incidentType)
      .values(values)
      .onConflictDoNothing({ target: incidentType.code })
      .returning();
    return row ? { ...row, inUse: false } : null;
  }

  /** Updates one type; null when no type has that ID. */
  async updateIncidentType(
    id: string,
    changes: IncidentTypeUpdate,
  ): Promise<IncidentType | null> {
    return this.db.transaction(async (tx) => {
      await tx.update(incidentType).set(changes).where(eq(incidentType.id, id));
      return this.findIncidentType(id, tx);
    });
  }

  /**
   * Deletes a type nothing uses. The row lock makes a report that's being
   * filed with the type wait, so the check and the delete can't race it.
   */
  deleteIncidentType(id: string): Promise<DeleteResult> {
    return this.db.transaction(async (tx) => {
      const [locked] = await tx
        .select({ id: incidentType.id })
        .from(incidentType)
        .where(eq(incidentType.id, id))
        .for('update');
      if (!locked) return 'missing';
      const row = await this.findIncidentType(id, tx);
      if (row!.inUse) return 'in_use';
      await tx.delete(incidentType).where(eq(incidentType.id, id));
      return 'deleted';
    });
  }
}
