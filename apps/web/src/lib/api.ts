import type { z } from 'zod';
import { API_URL } from './env';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** One failed check from the API's Zod validation (nestjs-zod's 400 body). */
export interface ApiIssue {
  path: PropertyKey[];
  message: string;
  code?: string;
}

/**
 * A response with a status the caller didn't accept. `body` is the API's
 * error JSON when there is one: `{ statusCode, message, errors? }`.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly method: Method,
    readonly path: string,
    readonly body?: unknown,
  ) {
    super(`${method} ${path} failed with ${status}`);
    this.name = 'ApiError';
  }

  /** Per-field validation failures from a 400, for mapping onto form fields. */
  get issues(): ApiIssue[] {
    const errors = (this.body as { errors?: unknown } | undefined)?.errors;
    return Array.isArray(errors) ? (errors as ApiIssue[]) : [];
  }
}

export interface RequestOptions {
  /** Aborts the request; pass TanStack Query's `signal` in queries. */
  signal?: AbortSignal;
  /** Error statuses whose body still matches the schema, e.g. health's 503. */
  acceptStatuses?: number[];
}

/**
 * Without a schema, `S` stays `z.ZodVoid` and the call resolves nothing, as
 * for a 204.
 */
async function request<S extends z.ZodType = z.ZodVoid>(
  method: Method,
  path: string,
  {
    schema,
    body,
    signal,
    acceptStatuses = [],
  }: RequestOptions & { schema?: S; body?: unknown },
): Promise<z.output<S>> {
  // The API is on another origin, so send the session cookie explicitly.
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    signal,
    ...(body !== undefined && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
  if (!res.ok && !acceptStatuses.includes(res.status)) {
    const errorBody: unknown = await res.json().catch(() => undefined);
    throw new ApiError(res.status, method, path, errorBody);
  }
  if (!schema || res.status === 204) return undefined as z.output<S>;
  // parse() also decodes wire types, such as ISO strings into Dates.
  return schema.parse(await res.json());
}

/** A write with a JSON body; pass a schema to parse the response. */
const send =
  (method: Method) =>
  <S extends z.ZodType = z.ZodVoid>(
    path: string,
    body?: unknown,
    schema?: S,
    options?: RequestOptions,
  ) =>
    request(method, path, { ...options, body, schema });

/**
 * The API client. Every call sends the session cookie, throws `ApiError` on
 * an unaccepted status, and parses the body with the given schema.
 */
export const api = {
  get: <S extends z.ZodType>(
    path: string,
    schema: S,
    options?: RequestOptions,
  ) => request('GET', path, { ...options, schema }),

  /** Like `get`, but null when the record doesn't exist (`missing`, 404 by default). */
  getOrNull: async <S extends z.ZodType>(
    path: string,
    schema: S,
    {
      missing = [404],
      ...options
    }: RequestOptions & { missing?: number[] } = {},
  ): Promise<z.output<S> | null> => {
    try {
      return await api.get(path, schema, options);
    } catch (error) {
      if (error instanceof ApiError && missing.includes(error.status)) {
        return null;
      }
      throw error;
    }
  },

  post: send('POST'),
  put: send('PUT'),
  patch: send('PATCH'),
  delete: <S extends z.ZodType = z.ZodVoid>(
    path: string,
    schema?: S,
    options?: RequestOptions,
  ) => request('DELETE', path, { ...options, schema }),
};
