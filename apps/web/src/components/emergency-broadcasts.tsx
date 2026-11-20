import { useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BroadcastCard } from '@/components/broadcast-card';
import { Label } from '@/components/ui/label';

/**
 * Representative advisory records. These can later be replaced with TanStack
 * Query data while keeping the presentational structure unchanged.
 */
const advisories = [
  {
    id: 1,
    recipient: 'Another Lloyd Magana',
    posted: 'Sep 3, 2026, 6:09 AM',
    title: 'Pre-Evacuation Advisory',
    message:
      'Residents in high-risk zones are advised to prepare for possible evacuation. Keep communication lines open, assist vulnerable household members, and follow barangay teams for updates.',
  },
  {
    id: 2,
    recipient: 'Response team assigned',
    posted: 'Apr 4, 2026, 4:58 AM',
    title: 'Community Advisory #01',
    message:
      'Road monitoring in progress. Expect rerouting along main thoroughfares. Stay tuned for updates.',
  },
  {
    id: 3,
    recipient: 'Response team assigned',
    posted: 'Mar 31, 2026, 11:59 PM',
    title: 'Community Advisory #02',
    message:
      'Report injuries and urgent medical concerns to the barangay health officer immediately.',
  },
  {
    id: 4,
    recipient: 'Response team assigned',
    posted: 'Mar 28, 2026, 6:58 PM',
    title: 'Community Advisory #03',
    message:
      'Stockpile clean drinking water and non-perishable food for at least three days. Coordinate with barangay captains.',
  },
];

const quickTemplates = [
  'Aftershock Safety Reminder',
  'Immediate Evacuation Order',
  'Pre-Evacuation Advisory',
  'Road Closure Notice',
];

export function EmergencyBroadcasts() {
  const [allResidents, setAllResidents] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');

  const visibleAdvisories = advisories.filter((advisory) =>
    `${advisory.title} ${advisory.message}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );

  return (
    <div className="flex flex-col overflow-hidden lg:h-[calc(100svh-6.5rem)]">
      {/* Main responsive workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(340px,0.9fr)_minmax(360px,1.1fr)]">
        {/* Compose area */}
        <div className="rounded-lg flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto">
          <Card className="overflow-hidden rounded-lg py-0 shadow-sm border border-border">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-xl font-semibold">
                Target Area
              </CardTitle>
            </CardHeader>

            <CardContent className="pb-3">
              {/* Clear selection remains prominent even on narrow screens. */}
              <Button
                variant="secondary"
                size="sm"
                className="mb-1 h-7 w-full justify-start rounded-md text-xs"
                onClick={() => setAllResidents(false)}
              >
                Select target barangay/s
              </Button>

              <div
                className="relative h-[160px] overflow-hidden rounded-md border border-border bg-muted md:h-[190px]"
                aria-label="Map showing the broadcast target area"
                role="img"
              >
                {/* TODO(#66): Replace with the MapLibre target-area map. */}
                <div className="absolute inset-0 grid place-items-center">
                  <div
                    aria-hidden="true"
                    className="relative h-20 w-32 border border-dashed border-muted-foreground/50"
                  >
                    <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 rotate-45 bg-muted-foreground/50" />
                    <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 -rotate-45 bg-muted-foreground/50" />
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-card/95 px-2.5 py-2">
                  <Checkbox
                    id="all-residents"
                    checked={allResidents}
                    onCheckedChange={(checked) =>
                      setAllResidents(checked === true)
                    }
                    className="size-3.5"
                  />
                  <Label
                    htmlFor="all-residents"
                    className="cursor-pointer text-xs font-medium"
                  >
                    All residents (no selection)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-border py-0 shadow-sm">
            <CardHeader className="pt-3">
              <CardTitle className="text-lg font-semibold">
                Compose Advisory
              </CardTitle>
            </CardHeader>

            <CardContent className="pb-3">
              <p className="mb-3 text-xs leading-4 text-muted-foreground">
                Send an advisory to residents inside the selected target area.
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="broadcast-title"
                    className="text-base font-semibold"
                  >
                    Title
                  </Label>
                  <Input
                    id="broadcast-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Heavy rainfall warning"
                    className="h-9 text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this short and specific. This appears as the advisory
                    heading.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="broadcast-message"
                    className="text-base font-semibold"
                  >
                    Message
                  </Label>
                  <Textarea
                    id="broadcast-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="e.g. Residents in high-risk zones are advised..."
                    className="min-h-[74px] resize-none text-xs leading-4"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use these quick templates to save time
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {quickTemplates.map((template) => (
                      <Button
                        key={template}
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 rounded-md px-2.5 text-xs"
                        onClick={() => setTitle(template)}
                      >
                        {template}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="secondary"
                    className="h-9 text-xs"
                    type="button"
                  >
                    Save as template
                  </Button>
                  <Button className="h-9 text-xs">Send advisory</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent advisories */}
        <Card className="rounded-lg py-0 shadow-sm lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xl font-semibold">
              Recent Advisories
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Published advisories appear here with the title and full message.
            </p>
          </CardHeader>

          <CardContent className="pb-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <div className="relative mb-2">
              <SearchIcon className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Filter recent advisories"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter by type..."
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-0.5">
              {visibleAdvisories.map((advisory) => (
                <BroadcastCard
                  key={advisory.id}
                  recipient={advisory.recipient}
                  posted={advisory.posted}
                  title={advisory.title}
                  message={advisory.message}
                  onViewRecipients={() => {
                    // Open the recipient details for this advisory.
                  }}
                  onResend={() => {
                    // Send this advisory again.
                  }}
                />
              ))}

              {visibleAdvisories.length === 0 && (
                <div className="rounded-md border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                  No advisories match this filter.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
