import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import {
  type Barangay,
  geocodeQuerySchema,
  geocodeResultSchema,
  reverseGeocodeQuerySchema,
  reverseGeocodeResultSchema,
} from '@repo/shared';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator.js';
import { GeocodingService } from './geocoding.service.js';

class GeocodeQueryDto extends createZodDto(geocodeQuerySchema) {}
class GeocodeResultDto extends createZodDto(geocodeResultSchema) {}
class ReverseGeocodeQueryDto extends createZodDto(reverseGeocodeQuerySchema) {}
class ReverseGeocodeResultDto extends createZodDto(
  reverseGeocodeResultSchema,
) {}

const ref = (barangay: Barangay | null) =>
  barangay && { id: barangay.id, name: barangay.name };

/** Lookups for the dashboard's location picker; Nominatim's quota is shared, so responders only. */
@Roles(['responder', 'admin'])
@Controller('geo')
export class GeocodingController {
  constructor(private readonly geocoding: GeocodingService) {}

  @Get('geocode')
  @ZodResponse({ type: GeocodeResultDto })
  async geocode(@Query() { q }: GeocodeQueryDto) {
    const result = await this.geocoding.geocode(q);
    if (!result) throw new NotFoundException('No place in Miagao matches');
    return { point: result.point, barangay: ref(result.barangay) };
  }

  @Get('reverse')
  @ZodResponse({ type: ReverseGeocodeResultDto })
  async reverse(@Query() point: ReverseGeocodeQueryDto) {
    const { label, barangay } = await this.geocoding.reverse(point);
    return { label, barangay: ref(barangay) };
  }
}
