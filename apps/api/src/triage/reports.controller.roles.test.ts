import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { adminPlugin } from '../auth/roles.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';

// #41: triage routes expose incident and resident data, so the API checks roles itself.
describe('triage report routes by role', () => {
  // Real Better Auth guard on an in-memory database, as in roles.decorator.test.ts.
  const store: Record<string, Record<string, unknown>[]> = {
    user: [],
    session: [],
    account: [],
    verification: [],
  };
  const auth = betterAuth({
    secret: 'test-secret-test-secret-test-secret',
    baseURL: 'http://localhost:3000',
    database: memoryAdapter(store),
    emailAndPassword: { enabled: true },
    plugins: [adminPlugin],
  });
  // The service isn't under test here; empty results are enough to reach 200.
  const reports = {
    findFeed: vi.fn().mockResolvedValue([]),
    findDetail: vi.fn(),
  };
  let app: INestApplication;

  // Signs up a user, sets their role, and returns their session cookie.
  const signInAs = async (role: string) => {
    const email = `${role}@example.com`;
    const res = await auth.api.signUpEmail({
      body: { email, password: 'password1234', name: role },
      returnHeaders: true,
    });
    store.user!.find((u) => u.email === email)!.role = role;
    return res.headers.get('set-cookie')!;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule.forRoot({ auth })],
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: reports }],
    }).compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests without a session', async () => {
    const res = await request(app.getHttpServer()).get('/triage/reports');
    expect(res.status).toBe(401);
  });

  it('lets responders and admins list reports', async () => {
    for (const role of ['responder', 'admin']) {
      const res = await request(app.getHttpServer())
        .get('/triage/reports')
        .set('Cookie', await signInAs(role));
      expect(res.status).toBe(200);
    }
  });

  it('rejects any other role on both routes', async () => {
    const cookie = await signInAs('guest');
    const server = app.getHttpServer();
    expect(
      (await request(server).get('/triage/reports').set('Cookie', cookie))
        .status,
    ).toBe(403);
    expect(
      (await request(server).get(`/triage/reports/${id}`).set('Cookie', cookie))
        .status,
    ).toBe(403);
    expect(reports.findDetail).not.toHaveBeenCalled();
  });
});
