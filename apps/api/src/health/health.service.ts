import { Injectable } from '@nestjs/common';
import type { Health, HealthStatus } from '@repo/shared';
import { HealthRepository } from './health.repository.js';

@Injectable()
export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

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
      await this.repository.ping();
      return 'ok';
    } catch {
      return 'error';
    }
  }
}
