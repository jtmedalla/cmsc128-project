import { CallButton } from '@/components/contact-number';

/** list of emergency hotlines as defined in agency table of database */
const hotlines = [
  { name: 'National emergency', number: '911' },
  { name: 'BFP', number: '(033) 000-0101' },
  { name: 'MSWDO', number: '(033) 000-0104' },
  { name: 'PNP', number: '(033) 000-0102' },
  { name: 'RHU', number: '(033) 000-0103' },
];

export function HotlinesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Emergency hotlines</h1>
      <ul className="flex flex-col gap-3">
        {hotlines.map((hotline) => (
          <li
            key={hotline.name}
            className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{hotline.name}</p>
              <p className="text-sm text-muted-foreground">{hotline.number}</p>
            </div>
            <CallButton
              number={hotline.number}
              label={`Call ${hotline.name}: ${hotline.number}`}
              className="shrink-0"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
