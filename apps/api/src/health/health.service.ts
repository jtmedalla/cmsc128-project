import { Inject, Injectable } from '@nestjs/common';
import type { Health, HealthStatus } from '@repo/shared';
import { sql } from 'drizzle-orm';
import type { Database } from '../database/client.js';
import { DB } from '../database/database.module.js';

@Injectable()
export class HealthService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async check(): Promise<Health> {
    const database = await this.checkDatabase();
    return {
      status: database,
      checks: { database },
      uptime: Math.floor(process.uptime()),
      checkedAt: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<HealthStatus> {
    try {
      await this.db.execute(sql`select 1`);
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
