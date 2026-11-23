import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Agency, AgencyCreate, AgencyUpdate } from '@repo/shared';
import { AgenciesRepository, NAME_TAKEN } from './agencies.repository.js';

/**
 * Partner agencies admins add, edit and retire (FR46). Retiring hides an
 * agency from hotlines; only a private one no referral names, such as a
 * mistaken or test entry, can be deleted.
 */
@Injectable()
export class AgenciesService {
  constructor(private readonly repository: AgenciesRepository) {}

  list(): Promise<Agency[]> {
    return this.repository.findAgencies();
  }

  async create(input: AgencyCreate): Promise<Agency> {
    const row = await this.repository.insertAgency(input);
    if (row === NAME_TAKEN) throw nameTaken(input.name);
    return row;
  }

  async update(id: string, changes: AgencyUpdate): Promise<Agency> {
    const row = await this.repository.updateAgency(id, changes);
    if (row === NAME_TAKEN) throw nameTaken(changes.name);
    if (!row) throw new NotFoundException('Agency not found');
    return row;
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.deleteAgency(id);
    if (result === 'missing') throw new NotFoundException('Agency not found');
    if (result === 'public') {
      throw new ConflictException(
        'This agency is listed on hotlines; unlist it first',
      );
    }
    if (result === 'in_use') {
      throw new ConflictException(
        'Referrals name this agency; retire it instead',
      );
    }
  }
}

function nameTaken(name: string) {
  return new ConflictException(`An agency named "${name}" already exists`);
}
