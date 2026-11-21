import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, apiFetch, apiFetchOrNull } from './api';
import { API_URL } from './env';

const schema = z.object({ at: z.iso.datetime().transform((s) => new Date(s)) });
const body = { at: '2026-11-20T00:00:00.000Z' };

function respondWith(status: number, json: unknown = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(json), { status })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('sends the session cookie and signal to the API', async () => {
    respondWith(200, body);
    const signal = new AbortController().signal;
    await apiFetch('/things', schema, { signal });
    expect(fetch).toHaveBeenCalledWith(`${API_URL}/things`, {
      credentials: 'include',
      signal,
    });
  });

  it('parses the body with the schema', async () => {
    respondWith(200, body);
    expect(await apiFetch('/things', schema)).toEqual({
      at: new Date(body.at),
    });
  });

  it('throws an ApiError with the status on a non-2xx response', async () => {
    respondWith(500);
    const error = await apiFetch('/things', schema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 500, path: '/things' });
  });

  it('parses error statuses it was told to accept', async () => {
    respondWith(503, body);
    await expect(
      apiFetch('/things', schema, { acceptStatuses: [503] }),
    ).resolves.toEqual({ at: new Date(body.at) });
  });

  it('rejects a body that does not match the schema', async () => {
    respondWith(200, { at: 'not a date' });
    await expect(apiFetch('/things', schema)).rejects.toThrow();
  });
});

describe('apiFetchOrNull', () => {
  it('resolves null on 404 by default', async () => {
    respondWith(404);
    expect(await apiFetchOrNull('/things/1', schema)).toBeNull();
  });

  it('resolves null on each status listed as missing', async () => {
    respondWith(400);
    expect(
      await apiFetchOrNull('/things/x', schema, { missing: [400, 404] }),
    ).toBeNull();
  });

  it('still throws on other errors', async () => {
    respondWith(500);
    await expect(apiFetchOrNull('/things/1', schema)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
