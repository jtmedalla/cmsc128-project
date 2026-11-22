import { cn } from 'cn';

/** One label and value inside a `<dl>`; a missing or empty value reads "Not given". */
export function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  const missing = value === null || value === undefined || value === '';
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn('wrap-break-word', missing && 'text-muted-foreground')}>
        {missing ? 'Not given' : value}
      </dd>
    </div>
  );
}
