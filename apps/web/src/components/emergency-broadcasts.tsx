import { useState } from 'react';
import { HistoryIcon, SearchIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BroadcastCard } from '@/components/broadcast-card';

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Page header */}
      <header className="flex h-[61px] items-center justify-between border-b border-border bg-card px-4 md:px-6">
        <h1 className="text-2xl font-semibold">Emergency Broadcasts</h1>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="h-7 gap-1.5 rounded-md px-2.5 text-xs"
          >
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-success"
            />
            Active
          </Badge>

          <Button variant="ghost" size="sm" className="h-8 text-xs">
            <HistoryIcon className="size-3.5" />
            Broadcast history
          </Button>
        </div>
      </header>

      {/* Main responsive workspace */}
      <div className="grid min-h-[calc(100vh-61px)] grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(340px,0.9fr)_minmax(360px,1.1fr)]">
        {/* Compose area */}
        <div className="flex flex-col gap-3">
          <Card className="overflow-hidden rounded-lg py-0 shadow-sm">
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
                Draw a shape to select residents to target
              </Button>

              {/* CSS-rendered map avoids coupling the page to a third-party
                  map library when only a selection preview is required. */}
              <div
                className="relative h-[160px] overflow-hidden rounded-md border border-border bg-[linear-gradient(145deg,#bfccaa_0%,#b4c5ad_28%,#ccd5c2_55%,#9bb09d_100%)] md:h-[190px]"
                aria-label="Map showing the broadcast target area"
                role="img"
              >
                <div className="absolute left-[-12%] top-[32%] h-[7px] w-[125%] rotate-[14deg] bg-white/75 shadow-[0_1px_0_rgba(35,48,82,0.15)]" />
                <div className="absolute left-[18%] top-[-12%] h-[130%] w-[6px] rotate-[24deg] bg-white/70" />
                <div className="absolute right-[22%] top-[-18%] h-[140%] w-[5px] rotate-[-14deg] bg-white/60" />
                <div className="absolute bottom-[18%] left-[-8%] h-[5px] w-[118%] -rotate-[7deg] bg-white/70" />
                <div className="absolute right-[9%] top-[22%] size-2.5 rounded-full border-2 border-highlight bg-card shadow-sm" />

                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-card/95 px-2.5 py-2">
                  <Checkbox
                    id="all-residents"
                    checked={allResidents}
                    onCheckedChange={(checked) =>
                      setAllResidents(checked === true)
                    }
                    className="size-3.5"
                  />
                  <label
                    htmlFor="all-residents"
                    className="cursor-pointer text-xs font-medium"
                  >
                    All residents (no selection)
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg py-0 shadow-sm">
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
                  <label
                    htmlFor="broadcast-title"
                    className="text-base font-semibold"
                  >
                    Title
                  </label>
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
                  <label
                    htmlFor="broadcast-message"
                    className="text-base font-semibold"
                  >
                    Message
                  </label>
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
        <Card className="h-fit rounded-lg py-0 shadow-sm lg:h-[calc(100vh-85px)] lg:overflow-hidden">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-xl font-semibold">
              Recent Advisories
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Published advisories appear here with the title and full message.
            </p>
          </CardHeader>

          <CardContent className="pb-3">
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

            <div className="space-y-2 lg:max-h-[calc(100vh-172px)] lg:overflow-y-auto lg:pr-0.5">
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

export default EmergencyBroadcasts;
