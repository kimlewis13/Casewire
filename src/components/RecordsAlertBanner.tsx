import type { ExtractionFlag } from "@/lib/types";

const SEVERITY_STRIPE: Record<ExtractionFlag["severity"], string> = {
  high: "border-l-4 border-danger bg-danger/5",
  medium: "border-l-4 border-warning bg-warning/5",
  low: "border-l-4 border-border bg-background",
};

function HazardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.516 11.59c.75 1.334-.213 2.987-1.743 2.987H3.484c-1.53 0-2.493-1.653-1.743-2.987L8.257 3.1zM10 7a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 0110 7zm0 7a.9.9 0 100-1.8.9.9 0 000 1.8z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * A top-of-page callout summarizing what the records review found, phrased
 * as things to go do (not just facts to confirm) — separate from the rail's
 * checklist, which is where those same items get checked off.
 */
export function RecordsAlertBanner({ flags }: { flags: ExtractionFlag[] }) {
  const unresolved = flags.filter((f) => !f.resolved);
  if (unresolved.length === 0) return null;

  return (
    <section className="rounded-lg border border-danger/30 bg-danger/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <HazardIcon className="h-5 w-5 shrink-0 text-danger" />
        <h2 className="font-display text-base font-semibold text-danger">
          Alert — medical records need follow-up
        </h2>
      </div>
      <p className="mb-3 text-sm text-muted">
        {unresolved.length} issue{unresolved.length === 1 ? "" : "s"} found while reviewing the
        file on hand — here&rsquo;s what to do next.
      </p>
      <ul className="flex flex-col gap-2.5">
        {unresolved.map((flag) => (
          <li
            key={flag.id}
            className={`rounded-md p-3 text-sm ${SEVERITY_STRIPE[flag.severity]}`}
          >
            {flag.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
