import { Module } from '@nestjs/common';
import { BarangayController } from './barangay.controller.js';
import { BarangayService } from './barangay.service.js';
import { GeoRepository } from './geo.repository.js';
import { GeocodingService } from './geocoding.service.js';

@Module({
  controllers: [BarangayController],
  providers: [BarangayService, GeocodingService, GeoRepository],
  exports: [BarangayService, GeocodingService],
})
export class GeoModule {}
