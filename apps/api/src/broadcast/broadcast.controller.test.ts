import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import type { RecentAdvisory } from '@repo/shared';
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
import { BroadcastController } from './broadcast.controller.js';
import { BroadcastService } from './broadcast.service.js';

vi.mock('../config/env.js', () => ({ env: {} }));

const id = '0b9a3f4e-8c1d-4e2a-9f6b-1c2d3e4f5a6b';
const at = new Date('2026-10-29T08:30:00.000Z');

const advisory: RecentAdvisory = {
  id,
  kind: 'advisory',
  messageBody: 'Prepare for possible evacuation.',
  sentAt: at,
  createdBy: { id: 'responder-1', name: 'Maria Santos' },
};

describe('/broadcast/advisories', () => {
  let app: INestApplication;
  const broadcasts = { findRecentAdvisories: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BroadcastController],
      providers: [
        { provide: BroadcastService, useValue: broadcasts },
        { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    broadcasts.findRecentAdvisories.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(['/broadcast/advisories', '/broadcast/advisories/recent'])(
    'returns recent advisories from %s',
    async (path) => {
      broadcasts.findRecentAdvisories.mockResolvedValue([advisory]);

      const res = await request(app.getHttpServer()).get(path);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          ...advisory,
          sentAt: at.toISOString(),
        },
      ]);
      expect(broadcasts.findRecentAdvisories).toHaveBeenCalledOnce();
    },
  );

  it('returns an empty list when there are no advisories', async () => {
    broadcasts.findRecentAdvisories.mockResolvedValue([]);

    const res = await request(app.getHttpServer()).get('/broadcast/advisories');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
