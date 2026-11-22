import type { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { Barangay } from '@repo/shared';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestAuth } from '../testing/auth.js';
import { BarangayController } from './barangay.controller.js';
import { BarangayService } from './barangay.service.js';
import { GeoRepository } from './geo.repository.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const id = '3b241101-e2bb-4255-8caf-4136c566a962';
const changes: Pick<Barangay, 'isCoastal' | 'isUpland' | 'hazards'> = {
  isCoastal: true,
  isUpland: false,
  hazards: ['flood'],
};
const updated: Barangay = {
  id,
  name: 'Tacas',
  centroid: { lng: 122.23, lat: 10.64 },
  boundary: null,
  ...changes,
};

describe('PATCH /geo/barangays/:id', () => {
  const { auth, signUp } = createTestAuth();
  const repository = { updateBarangay: vi.fn() };
  let app: INestApplication;
  let admin: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule.forRoot({ auth })],
      controllers: [BarangayController],
      providers: [
        BarangayService,
        { provide: GeoRepository, useValue: repository },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    admin = (await signUp('admin@example.com', 'admin')).cookie;
  });

  afterAll(async () => {
    await app.close();
  });

  const patch = (path: string, cookie: string, body: object = changes) =>
    request(app.getHttpServer()).patch(path).set('Cookie', cookie).send(body);

  it('updates flags and hazards', async () => {
    repository.updateBarangay.mockResolvedValue(updated);
    const res = await patch(`/geo/barangays/${id}`, admin);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(repository.updateBarangay).toHaveBeenCalledWith(id, changes);
  });

  it('returns 404 for an unknown barangay', async () => {
    repository.updateBarangay.mockResolvedValue(null);
    expect((await patch(`/geo/barangays/${id}`, admin)).status).toBe(404);
  });

  it('returns 400 for a malformed ID or unknown hazard', async () => {
    expect((await patch('/geo/barangays/nope', admin)).status).toBe(400);
    const res = await patch(`/geo/barangays/${id}`, admin, {
      ...changes,
      hazards: ['meteor'],
    });
    expect(res.status).toBe(400);
  });

  it('rejects responders', async () => {
    const { cookie } = await signUp('responder@example.com');
    expect((await patch(`/geo/barangays/${id}`, cookie)).status).toBe(403);
  });
});
