import Link from "next/link";
import type { CaseAction } from "@/lib/actions";
import type { CaseRecord } from "@/lib/types";

export function ActionQueue({
  items,
}: {
  items: { record: CaseRecord; action: CaseAction }[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="font-display text-lg font-semibold">All caught up.</p>
        <p className="mt-1 text-sm text-muted">
          No case needs action from you right now — the tracker will surface one the moment it does.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map(({ record, action }) => (
        <Link
          key={record.id}
          href={action.href}
          className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
            action.urgency === "urgent"
              ? "border-danger/40 bg-danger/5"
              : "border-border bg-surface"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                action.urgency === "urgent" ? "bg-danger" : "bg-accent-2"
              }`}
            />
            <div>
              <p className="font-semibold">{action.title}</p>
              <p className="text-sm text-muted">{action.description}</p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              action.urgency === "urgent"
                ? "bg-danger text-white"
                : "border border-border bg-background text-foreground"
            }`}
          >
            {action.ctaLabel} →
          </span>
        </Link>
      ))}
    </div>
  );
}
