import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Radio, SearchIcon, Send } from 'lucide-react';
import { LoadError } from '@/components/load-error';
import { Map as AppMap } from '@/components/map';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';
import { BroadcastCard } from './broadcast-card';
import { broadcastQueries } from '../queries';

/** Starting points that fill both the title and the message. */
const quickTemplates = [
  {
    title: 'Aftershock Safety Reminder',
    message:
      'Aftershocks may follow. Stay away from damaged buildings, keep exits clear, and drop, cover and hold on if shaking starts.',
  },
  {
    title: 'Immediate Evacuation Order',
    message:
      'Evacuate now to the nearest evacuation center. Bring your go-bag, IDs and medicines, and help neighbors who need assistance.',
  },
  {
    title: 'Pre-Evacuation Advisory',
    message:
      'Prepare to evacuate. Pack your go-bag, secure your home, and wait for further instructions from MDRRMO.',
  },
  {
    title: 'Road Closure Notice',
    message:
      'The road is closed until further notice. Use alternate routes and follow directions from responders on site.',
  },
];

/** `/dashboard/broadcasts`: compose an advisory beside the ones already sent. */
export function EmergencyBroadcasts() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        <ComposeCard />
        <SentAdvisories />
      </div>
    );
  }

  return (
    // The page fills main and each column scrolls on its own.
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      {/* p-px keeps the card's ring from being clipped by the panel. */}
      <ResizablePanel defaultSize="45" minSize="30" className="p-px pr-3">
        <ComposeCard />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="55" minSize="35" className="p-px pl-3">
        <SentAdvisories />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

/** The new-advisory form: target area, title, message and templates. */
function ComposeCard() {
  const [allResidents, setAllResidents] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  return (
    <Card className="md:h-full md:min-h-0">
      <CardHeader>
        <CardTitle>New advisory</CardTitle>
      </CardHeader>
      <CardContent className="md:min-h-0 md:flex-1 md:overflow-y-auto">
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel>Target</FieldLabel>
            {/* TODO(#66): pick the target barangays on this map. */}
            <div className="h-48 overflow-hidden rounded-lg border">
              <AppMap className="size-full" />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="all-residents"
                checked={allResidents}
                onCheckedChange={(checked) => setAllResidents(checked)}
              />
              <Label htmlFor="all-residents" className="font-normal">
                Whole municipality
              </Label>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="broadcast-title">Title</FieldLabel>
            <Input
              id="broadcast-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Heavy rainfall warning"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="broadcast-message">Message</FieldLabel>
            <Textarea
              id="broadcast-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="e.g. Residents in high-risk zones are advised..."
              className="min-h-28"
            />
            <FieldDescription>
              Keep it short and specific; residents read it in Messenger.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Templates</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((template) => (
                <Button
                  key={template.title}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setTitle(template.title);
                    setMessage(template.message);
                  }}
                >
                  {template.title}
                </Button>
              ))}
            </div>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" type="button">
          Save as template
        </Button>
        <Button>
          <Send data-icon="inline-start" />
          Send
        </Button>
      </CardFooter>
    </Card>
  );
}

/** Recently sent advisories, searchable, scrolling under a fixed header. */
function SentAdvisories() {
  const [filter, setFilter] = useState('');
  const { data, isPending, isError, refetch } = useQuery(
    broadcastQueries.recentAdvisories(),
  );

  const visible = (data ?? []).filter((advisory) =>
    advisory.messageBody.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <section
      aria-labelledby="sent-advisories"
      className="flex flex-col gap-3 md:h-full md:min-h-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="sent-advisories" className="font-medium">
          Sent advisories
        </h2>
        <InputGroup className="w-full sm:w-64">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Filter recent advisories"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search advisories"
          />
        </InputGroup>
      </div>

      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
        {isPending ? (
          <div
            aria-busy="true"
            aria-label="Loading advisories"
            className="contents"
          >
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : isError ? (
          <LoadError what="advisories" onRetry={() => void refetch()} />
        ) : visible.length ? (
          visible.map((advisory) => (
            <BroadcastCard
              key={advisory.id}
              id={advisory.id}
              sender={advisory.createdBy.name}
              sentAt={advisory.sentAt}
              message={advisory.messageBody}
              onResend={() => {
                // Send this advisory again.
              }}
            />
          ))
        ) : (
          <Empty className="rounded-xl border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Radio />
              </EmptyMedia>
              <EmptyTitle>
                {filter
                  ? 'No advisories match your search'
                  : 'No advisories yet'}
              </EmptyTitle>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </section>
  );
}
