import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { adminPlugin } from '../auth/roles.js';

/**
 * Better Auth on an in-memory store, configured like the app's, for tests
 * that need real sessions. Pass `auth` to `AuthModule.forRoot`.
 */
export function createTestAuth() {
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

  /** Signs a user up, optionally with a role, and returns their session. */
  async function signUp(email: string, role?: string) {
    const res = await auth.api.signUpEmail({
      body: { email, password: 'password1234', name: email },
      returnHeaders: true,
    });
    const user = store.user!.find((u) => u.email === email)!;
    if (role) user.role = role;
    return {
      cookie: res.headers.get('set-cookie')!,
      userId: res.response.user.id,
      user,
    };
  }

  return { auth, signUp };
}
