import { useQuery } from '@tanstack/react-query';
import { LoadError } from '@/components/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { authQueries } from '@/features/auth';
import { adminQueries } from '../queries';
import { UsersTable } from './users-data-table';

export function UsersPage() {
  const { data, isPending, isError, refetch } = useQuery(adminQueries.users());
  const { data: session } = useQuery(authQueries.session());

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Who can use the dashboard, and what they can do.
        </p>
      </div>
      {isPending ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <LoadError what="users" onRetry={() => void refetch()} />
      ) : (
        <UsersTable data={data} selfId={session?.user.id} />
      )}
    </div>
  );
}
