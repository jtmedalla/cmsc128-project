import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { respondWith } from '@/testing/render';
import { api, ApiError } from './api';
import { API_URL } from './env';

const schema = z.object({ at: z.iso.datetime().transform((s) => new Date(s)) });
const body = { at: '2026-11-20T00:00:00.000Z' };
const decoded = { at: new Date(body.at) };

/** The ApiError a call rejects with; fails the test if it resolves. */
async function rejection(call: Promise<unknown>): Promise<ApiError> {
  try {
    await call;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('expected the call to reject');
}

describe('api.get', () => {
  it('sends the session cookie and signal to the API', async () => {
    respondWith(200, body);
    const signal = new AbortController().signal;
    await api.get('/things', schema, { signal });
    expect(fetch).toHaveBeenCalledWith(`${API_URL}/things`, {
      method: 'GET',
      credentials: 'include',
      signal,
    });
  });

  it('parses the body with the schema', async () => {
    respondWith(200, body);
    expect(await api.get('/things', schema)).toEqual(decoded);
  });

  it('throws an ApiError with the status and error body', async () => {
    respondWith(500, { statusCode: 500, message: 'Internal server error' });
    const error = await rejection(api.get('/things', schema));
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 500,
      method: 'GET',
      path: '/things',
      body: { message: 'Internal server error' },
    });
  });

  it('parses error statuses it was told to accept', async () => {
    respondWith(503, body);
    await expect(
      api.get('/things', schema, { acceptStatuses: [503] }),
    ).resolves.toEqual(decoded);
  });
});

describe('api.getOrNull', () => {
  it('resolves null on 404, or on each status listed as missing', async () => {
    respondWith(404);
    expect(await api.getOrNull('/things/1', schema)).toBeNull();
    respondWith(400);
    expect(
      await api.getOrNull('/things/x', schema, { missing: [400, 404] }),
    ).toBeNull();
  });

  it('still throws on other errors', async () => {
    respondWith(500);
    await expect(api.getOrNull('/things/1', schema)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe('writes', () => {
  it.each(['post', 'put', 'patch'] as const)(
    '%s sends the body as JSON and parses the response',
    async (method) => {
      respondWith(200, body);
      expect(await api[method]('/things', { name: 'x' }, schema)).toEqual(
        decoded,
      );
      expect(fetch).toHaveBeenCalledWith(`${API_URL}/things`, {
        method: method.toUpperCase(),
        credentials: 'include',
        signal: undefined,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'x' }),
      });
    },
  );

  it('resolves nothing without a schema', async () => {
    respondWith(204);
    await expect(api.post('/things/1/archive')).resolves.toBeUndefined();
  });

  it('exposes validation issues from a 400', async () => {
    const issues = [
      { path: ['name'], message: 'Required', code: 'invalid_type' },
    ];
    respondWith(400, {
      statusCode: 400,
      message: 'Validation failed',
      errors: issues,
    });
    const error = await rejection(api.post('/things', {}, schema));
    expect(error.issues).toEqual(issues);
  });
});
