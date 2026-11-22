import { useRouter } from '@tanstack/react-router';
import { LoadError } from '@/components/load-error';

/** Shown when a guarded route can't load, e.g. the API is unreachable. */
export function RouteError() {
  const router = useRouter();

  return (
    <main className="flex min-h-svh p-6">
      {/* invalidate() reruns the guards and resets this error boundary. */}
      <LoadError what="this page" onRetry={() => void router.invalidate()} />
    </main>
  );
}
