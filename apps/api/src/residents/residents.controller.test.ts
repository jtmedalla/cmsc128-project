import type { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ResidentsController } from './residents.controller.js';
import { ResidentsRepository } from './residents.repository.js';
import { ResidentsService } from './residents.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const id = '3b241101-e2bb-4255-8caf-4136c566a962';
const listed = {
  id,
  name: 'John Doe',
  contactNumber: '09099923581',
  barangay: 'Poblacion',
  reportCount: 2,
  broadcastsOptIn: true,
  languagePreference: 'hil',
  lastMessaged: new Date('2026-11-20T08:00:00.000Z'),
};
const unnamed = {
  ...listed,
  id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  name: null,
  contactNumber: null,
  barangay: null,
  lastMessaged: null,
};

describe('/residents', () => {
  const repository = { findAll: vi.fn(), findProfile: vi.fn() };
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ResidentsController],
      providers: [
        ResidentsService,
        { provide: ResidentsRepository, useValue: repository },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists residents with dates as ISO strings and missing details as null', async () => {
    repository.findAll.mockResolvedValue([listed, unnamed]);
    const res = await request(app.getHttpServer()).get('/residents');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { ...listed, lastMessaged: '2026-11-20T08:00:00.000Z' },
      unnamed,
    ]);
  });

  it('returns a profile', async () => {
    repository.findProfile.mockResolvedValue({
      ...listed,
      age: 34,
      sex: 'male',
      locationText: 'Near the plaza',
    });
    const res = await request(app.getHttpServer()).get(`/residents/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      age: 34,
      locationText: 'Near the plaza',
    });
  });

  it('returns 404 for an unknown resident', async () => {
    repository.findProfile.mockResolvedValue(null);
    const res = await request(app.getHttpServer()).get(`/residents/${id}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed ID', async () => {
    const res = await request(app.getHttpServer()).get('/residents/not-a-uuid');
    expect(res.status).toBe(400);
  });
});
