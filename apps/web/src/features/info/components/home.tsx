import { Link } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';
import { Wordmark } from '@/components/wordmark';

export function Home() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1>
        <Wordmark className="text-4xl" />
      </h1>
      <nav className="flex flex-wrap gap-2">
        <Link to="/report" className={buttonVariants()}>
          Report an incident
        </Link>
        <Link to="/info" className={buttonVariants({ variant: 'outline' })}>
          Office info
        </Link>
        <Link
          to="/info/hotlines"
          className={buttonVariants({ variant: 'outline' })}
        >
          Hotlines
        </Link>
        <Link to="/dashboard" className={buttonVariants({ variant: 'ghost' })}>
          Responder dashboard
        </Link>
      </nav>
    </div>
  );
}
