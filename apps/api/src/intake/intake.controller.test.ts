import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthModule } from '@thallesp/nestjs-better-auth';
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
import { createTestAuth } from '../testing/auth.js';
import { IntakeController } from './intake.controller.js';
import { IntakeService } from './intake.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';

describe('/intake/reports', () => {
  const { auth, signUp } = createTestAuth();
  let app: INestApplication;
  let cookie: string;
  let userId: string;
  const intake = { createDashboardReport: vi.fn(), incidentTypes: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule.forRoot({ auth })],
      controllers: [IntakeController],
      providers: [
        { provide: IntakeService, useValue: intake },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    await app.init();
    ({ cookie, userId } = await signUp('responder@example.com'));
  });

  beforeEach(() => {
    intake.createDashboardReport.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates the report with the signed-in responder as its creator', async () => {
    intake.createDashboardReport.mockResolvedValue({
      id,
      trackingToken: 'token',
    });

    const res = await request(app.getHttpServer())
      .post('/intake/reports')
      .set('Cookie', cookie)
      .send({ severity: 'high', locationText: 'Santillan Street' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id });
    expect(intake.createDashboardReport).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'high' }),
      userId,
    );
  });

  it('returns 400 for an invalid report', async () => {
    const res = await request(app.getHttpServer())
      .post('/intake/reports')
      .set('Cookie', cookie)
      .send({ severity: 'extreme' });

    expect(res.status).toBe(400);
    expect(intake.createDashboardReport).not.toHaveBeenCalled();
  });
});
