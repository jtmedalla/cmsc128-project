import { Link } from '@tanstack/react-router';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

/** An unknown URL, with a link back to the home of the app the visitor is in. */
export function NotFound({ home }: { home: '/' | '/dashboard' }) {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestion />
        </EmptyMedia>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>
          The page you're looking for doesn't exist or has moved.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link to={home} />}
        >
          {home === '/' ? 'Go to homepage' : 'Go to dashboard'}
        </Button>
      </EmptyContent>
    </Empty>
  );
}
