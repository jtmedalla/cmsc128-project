import type { Sex } from '@repo/shared';
import { Mars, Venus } from 'lucide-react';
import { IconText } from '@/components/icon-text';
import { label } from '@/lib/format';

const ICONS = { male: Mars, female: Venus } as const;

/** "Male" or "Female" with its symbol. */
export function SexLabel({ sex, className }: { sex: Sex; className?: string }) {
  return (
    <IconText icon={ICONS[sex]} className={className}>
      {label(sex)}
    </IconText>
  );
}
