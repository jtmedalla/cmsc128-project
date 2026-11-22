import { cn } from 'cn';
import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/** A report's short ID ("#f36dbb4d"); clicking copies the full ID. */
export function ReportId({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  /* Show the check briefly, then go back to the copy icon. */
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      toast.success('Report ID copied');
    } catch {
      toast.error("Couldn't copy the report ID.");
    }
  }

  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      onClick={() => void copy()}
      title="Copy report ID"
      aria-label={`Copy report ID #${id.slice(0, 8)}`}
      className={cn(
        'group/id inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        className,
      )}
    >
      #{id.slice(0, 8)}
      <Icon
        aria-hidden
        className={cn(
          'size-3',
          !copied && 'opacity-50 group-hover/id:opacity-100',
        )}
      />
    </button>
  );
}
