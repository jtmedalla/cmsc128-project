import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { adminPlugin } from '../auth/roles.js';
import { DB } from '../database/database.module.js';
import { ResidentsController } from './residents.controller.js';
import { ResidentsService } from './residents.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

describe('residents role guards', () => {
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
  const chain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
  };
  const db = { select: vi.fn(() => chain) };
  let app: INestApplication;

  const signUp = async (email: string) => {
    const res = await auth.api.signUpEmail({
      body: { email, password: 'password1234', name: email },
      returnHeaders: true,
    });
    return res.headers.get('set-cookie')!;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule.forRoot({ auth })],
      controllers: [ResidentsController],
      providers: [ResidentsService, { provide: DB, useValue: db }],
    }).compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects requests without a session', async () => {
    const res = await request(app.getHttpServer()).get('/residents');
    expect(res.status).toBe(401);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('allows a signed-in responder', async () => {
    const cookie = await signUp('responder@example.com');
    const res = await request(app.getHttpServer())
      .get('/residents')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('allows an admin', async () => {
    const cookie = await signUp('admin@example.com');
    store.user!.find((u) => u.email === 'admin@example.com')!.role = 'admin';
    const res = await request(app.getHttpServer())
      .get('/residents')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
  });
});
