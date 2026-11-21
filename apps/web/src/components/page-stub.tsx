/** Placeholder for a sitemap page whose feature isn't built yet. */
export function PageStub({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">Not built yet.</p>
    </div>
  );
}
