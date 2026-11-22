import { Link } from '@tanstack/react-router';
import { FileQuestionMark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

/** A report ID that matches nothing, with the way back to the feed. */
export function ReportNotFound() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestionMark />
        </EmptyMedia>
        <EmptyTitle>This report doesn't exist.</EmptyTitle>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to="/dashboard/incidents" />}
        >
          Back to incidents
        </Button>
      </EmptyContent>
    </Empty>
  );
}
