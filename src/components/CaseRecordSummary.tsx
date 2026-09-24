import type { CaseRecord } from "@/lib/types";
import { INTAKE_FIELDS } from "@/lib/intakeScript";

export function CaseRecordSummary({
  record,
  variant = "sidebar",
}: {
  record: CaseRecord;
  variant?: "sidebar" | "primary";
}) {
  return (
    <aside
      className={
        variant === "sidebar"
          ? "sticky top-20 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
          : "flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6"
      }
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-2">
          Case facts
        </p>
        <p className="mt-1 text-xs text-muted">
          Everything captured so far — the same facts the records and demand
          letter pull from, nothing re-typed.
        </p>
      </div>

      <div className={variant === "primary" ? "grid gap-4 sm:grid-cols-2" : "flex flex-col gap-2 text-sm"}>
        {INTAKE_FIELDS.map((field) => {
          const value = record.intake.values[field.key];
          return (
            <div
              key={field.key}
              className={
                variant === "primary"
                  ? "rounded-xl border border-border bg-background p-3"
                  : "border-t border-border pt-2 first:border-0 first:pt-0"
              }
            >
              <p className="text-xs font-semibold text-muted">{field.label}</p>
              <p className={value ? "text-sm" : "text-sm italic text-muted"}>
                {value ?? "Not captured yet"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-3 text-sm">
        <p className="text-xs font-semibold text-muted">Medical records</p>
        {record.extraction.completed ? (
          <p>
            {record.extraction.chronology.length} chronology entries ·{" "}
            {record.extraction.flags.length === 0
              ? "nothing flagged"
              : `${record.extraction.flags.length} item${record.extraction.flags.length === 1 ? "" : "s"} to review`}
          </p>
        ) : (
          <p className="italic text-muted">None on file yet</p>
        )}
      </div>

      <div className="border-t border-border pt-3 text-sm">
        <p className="text-xs font-semibold text-muted">Demand letter</p>
        {record.draft.letter ? (
          <p>
            Drafted · {record.draft.reviewItems.length} item
            {record.draft.reviewItems.length === 1 ? "" : "s"} to review before sending
          </p>
        ) : (
          <p className="italic text-muted">Not drafted yet</p>
        )}
      </div>
    </aside>
  );
}
