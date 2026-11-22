import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { GeocodingController } from './geocoding.controller.js';
import { GeocodingService } from './geocoding.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';
// The full barangay; the routes trim it to its ID and name.
const barangay = { id, name: 'Tacas', isCoastal: true, hazards: [] };
const point = { lng: 122.2353, lat: 10.6415 };

describe('/geo', () => {
  let app: INestApplication;
  const geocoding = { geocode: vi.fn(), reverse: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GeocodingController],
      providers: [
        { provide: GeocodingService, useValue: geocoding },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    geocoding.geocode.mockReset();
    geocoding.reverse.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('geocodes text to a point and its barangay', async () => {
    geocoding.geocode.mockResolvedValue({ point, barangay });
    const res = await request(app.getHttpServer())
      .get('/geo/geocode')
      .query({ q: 'Miagao Church' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ point, barangay: { id, name: 'Tacas' } });
  });

  it('returns 404 when no place matches', async () => {
    geocoding.geocode.mockResolvedValue(null);
    const res = await request(app.getHttpServer())
      .get('/geo/geocode')
      .query({ q: 'nowhere' });
    expect(res.status).toBe(404);
  });

  it('reverse geocodes a point', async () => {
    geocoding.reverse.mockResolvedValue({
      label: 'Santillan Street',
      barangay,
    });
    const res = await request(app.getHttpServer())
      .get('/geo/reverse')
      .query(point);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      label: 'Santillan Street',
      barangay: { id, name: 'Tacas' },
    });
    expect(geocoding.reverse).toHaveBeenCalledWith(point);
  });

  it('returns 400 for a point off the globe', async () => {
    const res = await request(app.getHttpServer())
      .get('/geo/reverse')
      .query({ lat: 100, lng: 0 });
    expect(res.status).toBe(400);
    expect(geocoding.reverse).not.toHaveBeenCalled();
  });
});
