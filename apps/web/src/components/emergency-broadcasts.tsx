import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin } from 'lucide-react';

interface Advisory {
  title: string;
  issuedBy: string;
  message: string;
  sentAt: string;
  status: 'Sent' | 'Draft';
}

const advisories: Advisory[] = [
  {
    title: 'Pre-Evacuation Advisory',
    issuedBy: 'LDRRMO',
    sentAt: 'Sep 3, 2026 · 5:09 AM',
    status: 'Sent',
    message:
      'Residents in high-risk zones are advised to prepare for possible evacuation. Keep communication lines open, assist vulnerable household members, and follow barangay response teams for updates.',
  },
  {
    title: 'Community Advisory #01',
    issuedBy: 'Municipal Council',
    sentAt: 'Apr 4, 2026 · 4:58 AM',
    status: 'Sent',
    message:
      'Road monitoring in progress. Expect rerouting along main thoroughfares. Stay tuned for updates.',
  },
  {
    title: 'Community Advisory #02',
    issuedBy: 'MDRRMO',
    sentAt: 'Mar 31, 2026 · 11:59 PM',
    status: 'Sent',
    message:
      'Report injuries and urgent medical concerns to the emergency health officer immediately.',
  },
  {
    title: 'Community Advisory #03',
    issuedBy: 'MDRRMO',
    sentAt: 'Mar 28, 2026 · 6:58 PM',
    status: 'Sent',
    message:
      'Stockpile clean drinking water and non-perishable food for at least 3 days. Coordinate with barangay officials.',
  },
];

const templates = [
  'Aftershock Safety Reminder',
  'Immediate Evacuation Order',
  'Pre-Evacuation Advisory',
  'Road Closure Notice',
];

export function EmergencyBroadcasts() {
  return (
    <main className="min-h-screen bg-[#f8f9fb] text-slate-950">
      {/* The screenshot uses a compact title bar instead of a large hero header. */}
      <header className="flex h-[58px] items-center justify-between border-b bg-white px-8">
        <h1 className="text-[16px] font-semibold">Emergency Broadcasts</h1>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="h-7 rounded-md bg-slate-100 px-3 text-[11px] font-medium"
          >
            Active
          </Badge>
          <Button variant="outline" className="h-7 rounded-md px-3 text-[11px]">
            Broadcast History
          </Button>
        </div>
      </header>

      {/* A 50/50 split recreates the two-column administration layout. */}
      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr_0.82fr]">
        <section>
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold">Target Area</h2>
              <button
                type="button"
                className="text-[10px] font-medium text-slate-500"
              >
                Clear selection
              </button>
            </div>

            {/* Map container preserves the screenshot's muted aerial-map appearance. */}
            <div className="relative h-[132px] overflow-hidden rounded-md bg-slate-300">
              <div
                className="absolute inset-0 bg-cover bg-center grayscale-[20%]"
                style={{
                  backgroundImage:
                    "url('https://tile.openstreetmap.org/15/27002/15332.png')",
                }}
              />

              <div className="absolute bottom-[22px] left-3 flex items-center gap-1.5 rounded-sm bg-white px-2 py-1.5 text-[9px] shadow-sm">
                <MapPin className="h-3 w-3" />
                Draw a shape to select residents to target
              </div>

              <div className="absolute bottom-1.5 left-3 flex items-center gap-1.5 text-[9px]">
                <Checkbox id="all-residents" checked className="h-3.5 w-3.5" />
                <label htmlFor="all-residents">
                  All residents (no selection)
                </label>
              </div>
            </div>
          </div>

          <Card className="rounded-lg border-slate-200 p-0 shadow-none">
            <div className="p-4">
              <h2 className="text-[13px] font-semibold">Compose Advisory</h2>
              <p className="mt-1 text-[10px] text-slate-500">
                Send an advisory to residents inside the selected target area.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-medium">
                    Title
                  </label>
                  <Input
                    placeholder="e.g. Heavy rainfall warning"
                    className="h-8 rounded-md text-[10px]"
                  />
                  <p className="mt-1 text-[9px] text-slate-400">
                    Keep this short and specific. This appears as the advisory
                    heading.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-medium">
                    Message
                  </label>
                  <Textarea
                    placeholder="e.g. Residents in high-risk zones are advised to prepare for possible evacuation..."
                    className="min-h-[54px] resize-none rounded-md text-[10px]"
                  />
                  <p className="mt-1 text-[9px] text-slate-400">
                    Quick templates
                  </p>

                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {templates.map((template) => (
                      <Button
                        key={template}
                        variant="secondary"
                        className="h-6 rounded-md bg-slate-100 px-2 text-[9px] font-normal"
                      >
                        {template}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="h-8 rounded-md text-[10px]"
                  >
                    Save as template
                  </Button>
                  <Button className="h-8 rounded-md bg-slate-950 text-[10px] hover:bg-slate-800">
                    Send advisory
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* The right column mirrors the screenshot's advisory history panel. */}
        <aside>
          <h2 className="text-[13px] font-semibold">Recent Advisories</h2>
          <p className="mt-1 text-[10px] text-slate-500">
            Publish and advisories appear here with both the title and full
            message.
          </p>

          <label className="mt-2 block text-[9px] text-slate-500">
            Filter by type
          </label>
          <Input
            placeholder="Filter by type..."
            className="mt-1 h-8 rounded-md text-[10px]"
          />

          <div className="mt-3 space-y-2">
            {advisories.map((advisory, index) => (
              <Card
                key={`${advisory.title}-${index}`}
                className="rounded-md border-slate-200 p-3 shadow-none"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-[9px] text-slate-400">
                      {advisory.issuedBy} issued posted {advisory.sentAt}
                    </p>
                  </div>
                  <Badge className="h-5 rounded-full bg-slate-600 px-2 text-[8px] font-medium">
                    {advisory.status}
                  </Badge>
                </div>

                <h3 className="text-[12px] font-semibold">{advisory.title}</h3>
                <p className="mt-1 line-clamp-2 text-[9px] leading-[1.4] text-slate-600">
                  {advisory.message}
                </p>

                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    className="text-[9px] font-medium text-slate-700"
                  >
                    View recipients
                  </button>
                  <button
                    type="button"
                    className="text-[9px] font-medium text-slate-700"
                  >
                    Resend
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
