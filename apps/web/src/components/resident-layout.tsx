import { Link, Outlet } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Wordmark } from '@/components/wordmark';

/** Wraps `children`, or the matched child route when none are given. */
export function ResidentLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/">
            <Wordmark className="text-xl" />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children ?? <Outlet />}
      </main>
      <footer className="text-muted-foreground border-t py-4 text-center text-sm">
        MDRRMO Miagao
      </footer>
    </div>
  );
}
