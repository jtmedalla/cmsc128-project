import { useQuery } from '@tanstack/react-query';
import { LoadError } from '@/components/load-error';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { authQueries } from '@/features/auth';
import { adminQueries } from '../queries';
import { UserControls } from './user-controls';

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
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role and access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length ? (
                data.map((user) => {
                  const self = user.id === session?.user.id;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                        {self && (
                          <Badge variant="secondary" className="ml-2">
                            You
                          </Badge>
                        )}
                        {!user.active && (
                          <Badge variant="outline" className="ml-2">
                            Deactivated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <UserControls user={user} self={self} />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No users.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
