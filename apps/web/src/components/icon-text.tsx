import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';

/** An icon before text, sized to the text and centered on its first line even when it wraps. */
export function IconText({
  icon: Icon,
  className,
  children,
}: {
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('inline-flex items-start gap-1', className)}>
      <span aria-hidden className="flex h-lh shrink-0 items-center">
        <Icon className="size-[1em]" />
      </span>
      <span>{children}</span>
    </span>
  );
}
