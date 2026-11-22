import { cn } from 'cn';
import { Phone } from 'lucide-react';
import { IconText } from '@/components/icon-text';
import { Button } from '@/components/ui/button';

/** A phone number with an icon, always a tel: link so a tap dials it. */
export function ContactNumber({
  number,
  className,
}: {
  number: string;
  className?: string;
}) {
  return (
    <a href={`tel:${number}`} className="group/contact">
      <IconText
        icon={Phone}
        className={cn(
          'underline-offset-4 group-hover/contact:underline',
          className,
        )}
      >
        {number}
      </IconText>
    </a>
  );
}

/** A button that dials the number, for calling a reporter back. */
export function CallButton({
  number,
  className,
}: {
  number: string;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      nativeButton={false}
      render={<a href={`tel:${number}`} aria-label={`Call ${number}`} />}
    >
      <Phone data-icon="inline-start" />
      Call
    </Button>
  );
}
