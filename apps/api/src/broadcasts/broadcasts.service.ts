import { Injectable } from '@nestjs/common';
import type { RecentAdvisory } from '@repo/shared';
import { BroadcastsRepository } from './broadcasts.repository.js';

@Injectable()
export class BroadcastsService {
  constructor(private readonly repository: BroadcastsRepository) {}

  findRecentAdvisories(): Promise<RecentAdvisory[]> {
    return this.repository.findRecentAdvisories();
  }
}
