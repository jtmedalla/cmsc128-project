import { Injectable, NotFoundException } from '@nestjs/common';
import type { Barangay, BarangayUpdate, GeoPoint } from '@repo/shared';
import { GeoRepository } from './geo.repository.js';

/**
 * Reduces a barangay name to a comparable key, ignoring case, accents,
 * punctuation, a "Brgy." prefix and a "(Pob.)" suffix.
 */
export function barangayKey(name: string) {
  return name
    .normalize('NFD')
    .toLowerCase()
    .replace(/^\s*(barangay|brgy|bgy)\b\.?/, '')
    .replace(/\(pob\.?\)|\bpoblacion\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

@Injectable()
export class BarangayService {
  // Names change only through migrations, but the index also carries flags
  // and hazards, so `update` drops it.
  private byKey?: Promise<Map<string, Barangay>>;

  constructor(private readonly repository: GeoRepository) {}

  list(): Promise<Barangay[]> {
    return this.repository.findBarangays();
  }

  /** Changes a barangay's flags or hazards. */
  async update(id: string, changes: BarangayUpdate): Promise<Barangay> {
    const row = await this.repository.updateBarangay(id, changes);
    if (!row) throw new NotFoundException('Barangay not found');
    this.byKey = undefined;
    return row;
  }

  /** Matches a name as residents or the classifier write it. */
  async findByName(name: string) {
    this.byKey ??= this.list()
      .then((rows) => new Map(rows.map((row) => [barangayKey(row.name), row])))
      .catch((error: unknown) => {
        this.byKey = undefined;
        throw error;
      });
    return (await this.byKey).get(barangayKey(name)) ?? null;
  }

  /** The barangay whose boundary covers `point`, or null outside Miagao. */
  findContaining(point: GeoPoint): Promise<Barangay | null> {
    return this.repository.findBarangayContaining(point);
  }
}
