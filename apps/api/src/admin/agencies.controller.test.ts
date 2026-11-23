import type { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { Agency } from '@repo/shared';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestAuth } from '../testing/auth.js';
import { AgenciesController } from './agencies.controller.js';
import { AgenciesRepository, NAME_TAKEN } from './agencies.repository.js';
import { AgenciesService } from './agencies.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const id = '3b241101-e2bb-4255-8caf-4136c566a962';
const bfp: Agency = {
  id,
  name: 'BFP',
  contactNumber: '(033) 000-0101',
  isPublic: true,
  isActive: true,
  inUse: false,
};
const update = {
  name: bfp.name,
  contactNumber: bfp.contactNumber,
  isPublic: bfp.isPublic,
  isActive: bfp.isActive,
};

describe('/admin/agencies', () => {
  const { auth, signUp } = createTestAuth();
  const repository = {
    findAgencies: vi.fn(),
    insertAgency: vi.fn(),
    updateAgency: vi.fn(),
    deleteAgency: vi.fn(),
  };
  let app: INestApplication;
  let admin: string;
  let responder: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule.forRoot({ auth })],
      controllers: [AgenciesController],
      providers: [
        AgenciesService,
        { provide: AgenciesRepository, useValue: repository },
        { provide: APP_PIPE, useClass: ZodValidationPipe },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    admin = (await signUp('admin@example.com', 'admin')).cookie;
    responder = (await signUp('responder@example.com')).cookie;
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const post = (body: object) =>
    http().post('/admin/agencies').set('Cookie', admin).send(body);
  const put = (path: string, body: object = update) =>
    http().put(path).set('Cookie', admin).send(body);

  it('lists every agency, retired ones included', async () => {
    const retired = { ...bfp, isActive: false };
    repository.findAgencies.mockResolvedValue([retired]);
    const res = await http().get('/admin/agencies').set('Cookie', admin);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([retired]);
  });

  it('adds an agency', async () => {
    const added = { ...bfp, isPublic: false };
    repository.insertAgency.mockResolvedValue(added);
    const res = await post({ name: ' BFP ', contactNumber: '(033) 000-0101' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(added);
    expect(repository.insertAgency).toHaveBeenCalledWith({
      name: 'BFP',
      contactNumber: '(033) 000-0101',
    });
  });

  it('returns 409 when the name is taken', async () => {
    repository.insertAgency.mockResolvedValue(NAME_TAKEN);
    const res = await post({ name: 'BFP', contactNumber: null });
    expect(res.status).toBe(409);
    repository.updateAgency.mockResolvedValue(NAME_TAKEN);
    expect((await put(`/admin/agencies/${id}`)).status).toBe(409);
  });

  it('returns 400 for a public agency without a number', async () => {
    const res = await put(`/admin/agencies/${id}`, {
      ...update,
      contactNumber: null,
    });
    expect(res.status).toBe(400);
  });

  it('edits or retires an agency', async () => {
    const retired = { ...bfp, isActive: false };
    repository.updateAgency.mockResolvedValue(retired);
    const res = await put(`/admin/agencies/${id}`, {
      ...update,
      isActive: false,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(retired);
    expect(repository.updateAgency).toHaveBeenCalledWith(id, {
      ...update,
      isActive: false,
    });
  });

  it('returns 404 for an unknown agency', async () => {
    repository.updateAgency.mockResolvedValue(null);
    expect((await put(`/admin/agencies/${id}`)).status).toBe(404);
  });

  it('returns 400 for a malformed ID', async () => {
    expect((await put('/admin/agencies/nope')).status).toBe(400);
  });

  const del = () => http().delete(`/admin/agencies/${id}`).set('Cookie', admin);

  it('deletes a private, unused agency', async () => {
    repository.deleteAgency.mockResolvedValue('deleted');
    expect((await del()).status).toBe(204);
    expect(repository.deleteAgency).toHaveBeenCalledWith(id);
  });

  it.each(['public', 'in_use'])(
    'returns 409 when deleting an agency that is %s',
    async (result) => {
      repository.deleteAgency.mockResolvedValue(result);
      expect((await del()).status).toBe(409);
    },
  );

  it('returns 404 when deleting an unknown agency', async () => {
    repository.deleteAgency.mockResolvedValue('missing');
    expect((await del()).status).toBe(404);
  });

  it('rejects responders', async () => {
    const res = await http().get('/admin/agencies').set('Cookie', responder);
    expect(res.status).toBe(403);
  });
});
