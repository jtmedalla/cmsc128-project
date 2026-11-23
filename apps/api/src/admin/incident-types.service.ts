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
 * Incident types admins add, rename and retire (FR45). Types are never
 * deleted, since reports reference them; retiring hides them from intake.
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
}
