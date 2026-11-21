import { Module } from '@nestjs/common';
import { BarangayController } from './barangay.controller.js';
import { BarangayService } from './barangay.service.js';
import { GeocodingService } from './geocoding.service.js';

@Module({
  controllers: [BarangayController],
  providers: [BarangayService, GeocodingService],
  exports: [BarangayService, GeocodingService],
})
export class GeoModule {}
