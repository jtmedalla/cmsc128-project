import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type IncidentType,
  type IncidentTypeCreate,
  incidentTypeCode,
  type IncidentTypeUpdate,
} from '@repo/shared';
import { AdminRepository } from './admin.repository.js';

/**
 * Incident types admins add, rename and retire (FR45). Retiring hides a type
 * from intake; only a retired type nothing uses, such as a mistaken or test
 * entry, can be deleted.
 */
@Injectable()
export class IncidentTypesService {
  constructor(private readonly repository: AdminRepository) {}

  list(): Promise<IncidentType[]> {
    return this.repository.findIncidentTypes();
  }

  /** Adds an active type whose code comes from its name. */
  async create({ name }: IncidentTypeCreate): Promise<IncidentType> {
    const code = incidentTypeCode(name);
    const row = await this.repository.insertIncidentType({ code, name });
    if (!row) {
      throw new ConflictException(
        `An incident type with code "${code}" already exists`,
      );
    }
    return row;
  }

  async update(id: string, changes: IncidentTypeUpdate): Promise<IncidentType> {
    const row = await this.repository.updateIncidentType(id, changes);
    if (!row) throw new NotFoundException('Incident type not found');
    return row;
  }

  /** Deletes a retired type no report or report correction uses. */
  async delete(id: string): Promise<void> {
    const result = await this.repository.deleteIncidentType(id);
    if (result === 'missing') {
      throw new NotFoundException('Incident type not found');
    }
    if (result === 'active') {
      throw new ConflictException(
        'This incident type is active; retire it first',
      );
    }
    if (result === 'in_use') {
      throw new ConflictException(
        'Reports use this incident type; retire it instead',
      );
    }
  }
}
