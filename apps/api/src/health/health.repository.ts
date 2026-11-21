import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';

@Injectable()
export class HealthRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Rejects when the database can't answer a trivial query. */
  async ping(): Promise<void> {
    await this.db.execute(sql`select 1`);
  }
}
