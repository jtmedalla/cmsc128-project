import { Module } from '@nestjs/common';
import { BarangayController } from './barangay.controller.js';
import { BarangayService } from './barangay.service.js';
import { GeoRepository } from './geo.repository.js';
import { GeocodingController } from './geocoding.controller.js';
import { GeocodingService } from './geocoding.service.js';

@Module({
  controllers: [BarangayController, GeocodingController],
  providers: [BarangayService, GeocodingService, GeoRepository],
  exports: [BarangayService, GeocodingService],
})
export class GeoModule {}
