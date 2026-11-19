/**
 * The details panel's map slot (Figma "map-section": 220px tall, 16px corners),
 * crossed out until a real map replaces the cross.
 */
// TODO(map, issue not confirmed): render the report's location here.
export function ReportMap() {
  return (
    <div
      role="img"
      aria-label="Map not available yet"
      className="relative h-[220px] w-full overflow-hidden rounded-2xl border bg-muted/40"
    >
      {/* Two diagonals corner to corner; the lines stay 1px however the box stretches. */}
      <svg
        className="absolute inset-0 size-full text-border"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <line
          x1="0"
          y1="0"
          x2="100"
          y2="100"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="100"
          y1="0"
          x2="0"
          y2="100"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
