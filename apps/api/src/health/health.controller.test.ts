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
import { HealthController } from './health.controller.js';
import { HealthRepository } from './health.repository.js';
import { HealthService } from './health.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

describe('GET /health', () => {
  let app: INestApplication;
  const repository = { ping: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: HealthRepository, useValue: repository },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    repository.ping.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ok when the database answers', async () => {
    repository.ping.mockResolvedValue(undefined);
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      checks: { database: 'ok' },
      uptime: expect.any(Number),
      checkedAt: expect.any(String),
    });
  });

  it('returns 503 when the database is unreachable', async () => {
    repository.ping.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      status: 'error',
      checks: { database: 'error' },
    });
  });
});
