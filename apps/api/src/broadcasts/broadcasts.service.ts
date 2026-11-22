import { Injectable } from '@nestjs/common';
import type { BroadcastSummary } from '@repo/shared';
import { BroadcastsRepository } from './broadcasts.repository.js';

@Injectable()
export class BroadcastsService {
  constructor(private readonly repository: BroadcastsRepository) {}

  findRecentAdvisories(): Promise<BroadcastSummary[]> {
    return this.repository.findRecentAdvisories();
  }
}
