import type { z } from 'zod';
import { API_URL } from './env';

/** A response from the API with a status the caller didn't accept. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    super(`${path} failed with ${status}`);
    this.name = 'ApiError';
  }
}

export interface ApiFetchOptions {
  /** TanStack Query's abort signal, so cancelled queries stop downloading. */
  signal?: AbortSignal;
  /** Error statuses whose body still matches the schema, e.g. health's 503. */
  acceptStatuses?: number[];
}

/**
 * GETs `path` from the API and parses the body with `schema`, which also
 * decodes wire types such as ISO dates. Throws `ApiError` on any other
 * non-2xx status.
 */
export async function apiFetch<S extends z.ZodType>(
  path: string,
  schema: S,
  { signal, acceptStatuses = [] }: ApiFetchOptions = {},
): Promise<z.output<S>> {
  // The API is on another origin, so send the session cookie explicitly.
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    signal,
  });
  if (!res.ok && !acceptStatuses.includes(res.status)) {
    throw new ApiError(res.status, path);
  }
  return schema.parse(await res.json());
}

/**
 * Like `apiFetch`, but resolves null when the record doesn't exist.
 * `missing` lists the statuses that mean that (404 by default).
 */
export async function apiFetchOrNull<S extends z.ZodType>(
  path: string,
  schema: S,
  {
    missing = [404],
    ...options
  }: ApiFetchOptions & { missing?: number[] } = {},
): Promise<z.output<S> | null> {
  try {
    return await apiFetch(path, schema, options);
  } catch (error) {
    if (error instanceof ApiError && missing.includes(error.status)) {
      return null;
    }
    throw error;
  }
}
