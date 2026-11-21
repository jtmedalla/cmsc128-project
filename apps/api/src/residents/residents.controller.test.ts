import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ZodSerializerInterceptor } from 'nestjs-zod';
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
import { DB } from '../database/database.module.js';
import { ResidentsController } from './residents.controller.js';
import { ResidentsService } from './residents.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

describe('GET /residents', () => {
  let app: INestApplication;
  const orderBy = vi.fn();
  const chain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy,
  };
  const db = { select: vi.fn(() => chain) };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ResidentsController],
      providers: [
        ResidentsService,
        { provide: DB, useValue: db },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    orderBy.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists residents with the requested fields', async () => {
    orderBy.mockResolvedValue([
      {
        id: '3b241101-e2bb-4255-8caf-4136c566a962',
        name: 'John Doe',
        contactNumber: '09099923581',
        barangay: 'Poblacion',
        reportCount: 2,
        broadcastsOptIn: true,
        languagePreference: 'hil',
        lastMessaged: new Date('2026-11-20T08:00:00.000Z'),
      },
    ]);
    const res = await request(app.getHttpServer()).get('/residents');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: '3b241101-e2bb-4255-8caf-4136c566a962',
        name: 'John Doe',
        contactNumber: '09099923581',
        barangay: 'Poblacion',
        reportCount: 2,
        broadcastsOptIn: true,
        languagePreference: 'hil',
        lastMessaged: '2026-11-20T08:00:00.000Z',
      },
    ]);
  });

  it('keeps nulls for residents with missing details', async () => {
    orderBy.mockResolvedValue([
      {
        id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        name: null,
        contactNumber: null,
        barangay: null,
        reportCount: 0,
        broadcastsOptIn: false,
        languagePreference: 'tgl',
        lastMessaged: null,
      },
    ]);
    const res = await request(app.getHttpServer()).get('/residents');
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      name: null,
      contactNumber: null,
      barangay: null,
      reportCount: 0,
      lastMessaged: null,
    });
  });

  it('returns an empty list when there are no residents', async () => {
    orderBy.mockResolvedValue([]);
    const res = await request(app.getHttpServer()).get('/residents');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 when the query fails', async () => {
    orderBy.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const res = await request(app.getHttpServer()).get('/residents');
    expect(res.status).toBe(500);
  });
});
