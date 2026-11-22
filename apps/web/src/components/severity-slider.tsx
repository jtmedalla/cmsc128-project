import { type SeverityLevel, severityLevelSchema } from '@repo/shared';
import { cn } from 'cn';
import { SeverityBadge } from '@/components/report-badges';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { label } from '@/lib/format';
import { severityStyles } from '@/lib/report-states';

const LEVELS = severityLevelSchema.options;

/** Each level's color on the slider's range and thumb, spelled out so Tailwind finds them. */
const sliderColors: Record<SeverityLevel, string> = {
  low: '**:data-[slot=slider-range]:bg-severity-low **:data-[slot=slider-thumb]:border-severity-low',
  moderate:
    '**:data-[slot=slider-range]:bg-severity-moderate **:data-[slot=slider-thumb]:border-severity-moderate',
  high: '**:data-[slot=slider-range]:bg-severity-high **:data-[slot=slider-thumb]:border-severity-high',
  critical:
    '**:data-[slot=slider-range]:bg-severity-critical **:data-[slot=slider-thumb]:border-severity-critical',
};

/**
 * Severity on a slider from low to critical, in each level's color and icon.
 * Null is unknown: the range is empty until a level is picked, and Clear
 * returns to it.
 */
export function SeveritySlider({
  value,
  onValueChange,
  labelId,
}: {
  value: SeverityLevel | null;
  onValueChange: (value: SeverityLevel | null) => void;
  /** The field label's ID, which names the slider. */
  labelId?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-6 items-center justify-between">
        {value ? (
          <SeverityBadge severity={value} />
        ) : (
          <span className="text-sm text-muted-foreground">Unknown</span>
        )}
        {value && (
          <Button variant="ghost" size="xs" onClick={() => onValueChange(null)}>
            Clear
          </Button>
        )}
      </div>
      <Slider
        aria-labelledby={labelId}
        min={0}
        max={LEVELS.length - 1}
        step={1}
        // An array: shadcn's Slider draws one thumb per value, and two without one.
        value={[value ? LEVELS.indexOf(value) : 0]}
        onValueChange={(next) => {
          const index = Array.isArray(next) ? next[0] : next;
          onValueChange(LEVELS[index ?? 0] ?? null);
        }}
        className={cn(
          value
            ? sliderColors[value]
            : '**:data-[slot=slider-range]:bg-transparent',
        )}
      />
      <div className="flex justify-between">
        {LEVELS.map((level) => {
          const Icon = severityStyles[level].icon;
          return (
            <Button
              key={level}
              variant="ghost"
              size="xs"
              aria-pressed={level === value}
              onClick={() => onValueChange(level)}
              className={cn(
                'gap-0.5 px-1 text-muted-foreground',
                level === value && severityStyles[level].badge,
              )}
            >
              <Icon aria-hidden data-icon="inline-start" />
              {label(level)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
