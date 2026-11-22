import { RefreshCw } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

/** Refetches a query; the icon spins and the button waits while it runs. */
export function RefreshButton({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Refresh"
      disabled={refreshing}
      onClick={onRefresh}
    >
      <RefreshCw className={cn(refreshing && 'animate-spin')} />
    </Button>
  );
}
