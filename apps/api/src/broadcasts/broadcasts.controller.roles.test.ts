import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { adminPlugin } from '../auth/roles.js';
import { BroadcastsController } from './broadcasts.controller.js';
import { BroadcastsService } from './broadcasts.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

describe('broadcast advisory routes by role', () => {
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
  const broadcasts = {
    findRecentAdvisories: vi.fn().mockResolvedValue([]),
  };
  let app: INestApplication;

  const signInAs = async (role: string) => {
    const email = `${role}@example.com`;
    const res = await auth.api.signUpEmail({
      body: { email, password: 'password1234', name: role },
      returnHeaders: true,
    });
    store.user!.find((user) => user.email === email)!.role = role;
    return res.headers.get('set-cookie')!;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule.forRoot({ auth })],
      controllers: [BroadcastsController],
      providers: [{ provide: BroadcastsService, useValue: broadcasts }],
    }).compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests without a session', async () => {
    const res = await request(app.getHttpServer()).get(
      '/broadcasts/advisories',
    );
    expect(res.status).toBe(401);
  });

  it('lets responders and admins list advisories', async () => {
    for (const role of ['responder', 'admin']) {
      const res = await request(app.getHttpServer())
        .get('/broadcasts/advisories')
        .set('Cookie', await signInAs(role));
      expect(res.status).toBe(200);
    }
  });

  it('rejects any other role', async () => {
    const res = await request(app.getHttpServer())
      .get('/broadcasts/advisories')
      .set('Cookie', await signInAs('guest'));
    expect(res.status).toBe(403);
    expect(broadcasts.findRecentAdvisories).not.toHaveBeenCalled();
  });
});
