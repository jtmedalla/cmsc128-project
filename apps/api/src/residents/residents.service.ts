import { Injectable, NotFoundException } from '@nestjs/common';
import { residentListItemSchema, residentProfileSchema } from '@repo/shared';
import { ResidentsRepository } from './residents.repository.js';

@Injectable()
export class ResidentsService {
  constructor(private readonly repository: ResidentsRepository) {}

  async list() {
    const rows = await this.repository.findAll();
    return rows.map((row) => residentListItemSchema.encode(row));
  }

  async get(id: string) {
    const row = await this.repository.findProfile(id);
    if (!row) throw new NotFoundException('Resident not found');
    return residentProfileSchema.encode(row);
  }
}
