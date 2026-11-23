import type { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { IncidentType } from '@repo/shared';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestAuth } from '../testing/auth.js';
import { AdminRepository } from './admin.repository.js';
import { IncidentTypesController } from './incident-types.controller.js';
import { IncidentTypesService } from './incident-types.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const id = '3b241101-e2bb-4255-8caf-4136c566a962';
const fire: IncidentType = {
  id,
  code: 'fire',
  name: 'Fire',
  isActive: true,
  inUse: true,
};

describe('/admin/incident-types', () => {
  const { auth, signUp } = createTestAuth();
  const repository = {
    findIncidentTypes: vi.fn(),
    insertIncidentType: vi.fn(),
    updateIncidentType: vi.fn(),
    deleteIncidentType: vi.fn(),
  };
  let app: INestApplication;
  let admin: string;
  let responder: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule.forRoot({ auth })],
      controllers: [IncidentTypesController],
      providers: [
        IncidentTypesService,
        { provide: AdminRepository, useValue: repository },
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

  it('lists every type, retired ones included', async () => {
    const retired = { ...fire, isActive: false };
    repository.findIncidentTypes.mockResolvedValue([retired]);
    const res = await http().get('/admin/incident-types').set('Cookie', admin);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([retired]);
  });

  it('adds a type with a code made from its name', async () => {
    const surge = {
      id,
      code: 'storm_surge',
      name: 'Storm surge',
      isActive: true,
      inUse: false,
    };
    repository.insertIncidentType.mockResolvedValue(surge);
    const res = await http()
      .post('/admin/incident-types')
      .set('Cookie', admin)
      .send({ name: ' Storm surge ' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(surge);
    expect(repository.insertIncidentType).toHaveBeenCalledWith({
      code: 'storm_surge',
      name: 'Storm surge',
    });
  });

  it('returns 409 when the code is taken', async () => {
    repository.insertIncidentType.mockResolvedValue(null);
    const res = await http()
      .post('/admin/incident-types')
      .set('Cookie', admin)
      .send({ name: 'FIRE' });
    expect(res.status).toBe(409);
  });

  it('returns 400 for a name without letters or numbers', async () => {
    const res = await http()
      .post('/admin/incident-types')
      .set('Cookie', admin)
      .send({ name: '!!' });
    expect(res.status).toBe(400);
  });

  it('renames or retires a type', async () => {
    const retired = { ...fire, isActive: false };
    repository.updateIncidentType.mockResolvedValue(retired);
    const res = await http()
      .patch(`/admin/incident-types/${id}`)
      .set('Cookie', admin)
      .send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(retired);
    expect(repository.updateIncidentType).toHaveBeenCalledWith(id, {
      isActive: false,
    });
  });

  it('returns 404 for an unknown type', async () => {
    repository.updateIncidentType.mockResolvedValue(null);
    const res = await http()
      .patch(`/admin/incident-types/${id}`)
      .set('Cookie', admin)
      .send({ name: 'Blaze' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed ID or an empty change', async () => {
    const patch = (path: string, body: object) =>
      http().patch(path).set('Cookie', admin).send(body);
    expect(
      (await patch('/admin/incident-types/nope', { name: 'X' })).status,
    ).toBe(400);
    expect((await patch(`/admin/incident-types/${id}`, {})).status).toBe(400);
  });

  it('deletes an unused type', async () => {
    repository.deleteIncidentType.mockResolvedValue('deleted');
    const res = await http()
      .delete(`/admin/incident-types/${id}`)
      .set('Cookie', admin);
    expect(res.status).toBe(204);
    expect(repository.deleteIncidentType).toHaveBeenCalledWith(id);
  });

  it('returns 409 when deleting a type in use', async () => {
    repository.deleteIncidentType.mockResolvedValue('in_use');
    const res = await http()
      .delete(`/admin/incident-types/${id}`)
      .set('Cookie', admin);
    expect(res.status).toBe(409);
  });

  it('returns 404 when deleting an unknown type', async () => {
    repository.deleteIncidentType.mockResolvedValue('missing');
    const res = await http()
      .delete(`/admin/incident-types/${id}`)
      .set('Cookie', admin);
    expect(res.status).toBe(404);
  });

  it('rejects responders', async () => {
    const res = await http()
      .get('/admin/incident-types')
      .set('Cookie', responder);
    expect(res.status).toBe(403);
  });
});
