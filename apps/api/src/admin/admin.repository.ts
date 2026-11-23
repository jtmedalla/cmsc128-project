import { Inject, Injectable } from '@nestjs/common';
import type { IncidentType, IncidentTypeUpdate } from '@repo/shared';
import { eq } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';
import { incidentType } from '../database/schema/index.js';

@Injectable()
export class AdminRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Every incident type, retired ones included, by name. */
  findIncidentTypes(): Promise<IncidentType[]> {
    return this.db.select().from(incidentType).orderBy(incidentType.name);
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
    return row ?? null;
  }

  /** Updates one type; null when no type has that ID. */
  async updateIncidentType(
    id: string,
    changes: IncidentTypeUpdate,
  ): Promise<IncidentType | null> {
    const [row] = await this.db
      .update(incidentType)
      .set(changes)
      .where(eq(incidentType.id, id))
      .returning();
    return row ?? null;
  }
}
