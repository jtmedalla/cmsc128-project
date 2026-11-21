import type { UserRole } from '@repo/shared';
import { redirect } from '@tanstack/react-router';
import { authClient } from './auth-client';

type Session = NonNullable<
  Awaited<ReturnType<typeof authClient.getSession>>['data']
>;

/**
 * Sends users without one of `roles` back to the dashboard home. Only hides
 * pages; the API's `@Roles` is what actually enforces access.
 */
export function requireRole(session: Session, roles: UserRole[]) {
  if (!roles.some((role) => role === session.user.role)) {
    throw redirect({ to: '/dashboard' });
  }
}
