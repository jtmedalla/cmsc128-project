import type { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { Account } from '@repo/shared';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestAuth } from '../testing/auth.js';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const account: Account = {
  id: 'u1',
  name: 'Ana Responder',
  email: 'ana@example.com',
  role: 'responder',
  active: true,
  createdAt: new Date('2026-11-01T08:00:00.000Z'),
};

describe('UsersController', () => {
  const { auth, signUp } = createTestAuth();
  const repository = { findAll: vi.fn(), update: vi.fn() };
  let app: INestApplication;
  let admin: { cookie: string; userId: string };
  let responder: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule.forRoot({ auth })],
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    admin = await signUp('admin@example.com', 'admin');
    responder = (await signUp('responder@example.com')).cookie;
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const patch = (id: string, body: object, cookie = admin.cookie) =>
    request(server())
      .patch(`/admin/users/${id}`)
      .set('Cookie', cookie)
      .send(body);

  describe('GET /admin/users', () => {
    it('lists accounts with dates as ISO strings', async () => {
      repository.findAll.mockResolvedValue([account]);
      const res = await request(server())
        .get('/admin/users')
        .set('Cookie', admin.cookie);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { ...account, createdAt: '2026-11-01T08:00:00.000Z' },
      ]);
    });

    it('rejects responders', async () => {
      const res = await request(server())
        .get('/admin/users')
        .set('Cookie', responder);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /admin/users/:id', () => {
    it('changes a role or active flag', async () => {
      const updated = { ...account, role: 'admin', active: false };
      repository.update.mockResolvedValue(updated);
      const res = await patch('u1', { role: 'admin', active: false });
      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
      expect(repository.update).toHaveBeenCalledWith('u1', {
        role: 'admin',
        active: false,
      });
    });

    it('returns 404 for an unknown user', async () => {
      repository.update.mockResolvedValue(null);
      expect((await patch('nope', { active: false })).status).toBe(404);
    });

    it('returns 400 for an empty change or unknown role', async () => {
      expect((await patch('u1', {})).status).toBe(400);
      expect((await patch('u1', { role: 'owner' })).status).toBe(400);
    });

    it("refuses to change the admin's own account", async () => {
      repository.update.mockClear();
      const res = await patch(admin.userId, { role: 'responder' });
      expect(res.status).toBe(403);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('rejects responders', async () => {
      expect((await patch('u1', { active: false }, responder)).status).toBe(
        403,
      );
    });
  });
});
