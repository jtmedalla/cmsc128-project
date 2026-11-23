import type { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { ZodSerializerInterceptor } from 'nestjs-zod';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestAuth } from '../testing/auth.js';
import { HotlinesController } from './hotlines.controller.js';
import { InfoRepository } from './info.repository.js';
import { InfoService } from './info.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

describe('GET /info/hotlines', () => {
  const { auth } = createTestAuth();
  const repository = { findHotlines: vi.fn() };
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule.forRoot({ auth })],
      controllers: [HotlinesController],
      providers: [
        InfoService,
        { provide: InfoRepository, useValue: repository },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists hotlines without a session', async () => {
    const hotlines = [{ name: 'BFP', contactNumber: '(033) 000-0101' }];
    repository.findHotlines.mockResolvedValue(hotlines);
    const res = await request(app.getHttpServer()).get('/info/hotlines');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(hotlines);
  });
});
