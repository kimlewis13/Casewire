import type { CaseRecord } from "@/lib/types";
import { INTAKE_FIELDS } from "@/lib/intakeScript";

export function CaseRecordSummary({ record }: { record: CaseRecord }) {
  return (
    <aside className="sticky top-20 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-2">
          Shared case record
        </p>
        <p className="mt-1 text-xs text-muted">
          Every stage reads and writes this same record — nothing here gets re-typed.
        </p>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        {INTAKE_FIELDS.map((field) => {
          const value = record.intake.values[field.key];
          return (
            <div key={field.key} className="border-t border-border pt-2 first:border-0 first:pt-0">
              <p className="text-xs font-semibold text-muted">{field.label}</p>
              <p className={value ? "" : "italic text-muted"}>
                {value ?? "not captured yet"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-3 text-sm">
        <p className="text-xs font-semibold text-muted">Document extraction</p>
        {record.extraction.completed ? (
          <p>
            {record.extraction.chronology.length} chronology entries ·{" "}
            {record.extraction.flags.length} flag
            {record.extraction.flags.length === 1 ? "" : "s"} raised
          </p>
        ) : (
          <p className="italic text-muted">not run yet</p>
        )}
      </div>

      <div className="border-t border-border pt-3 text-sm">
        <p className="text-xs font-semibold text-muted">Demand draft</p>
        {record.draft.letter ? (
          <p>
            Generated · {record.draft.reviewItems.length} item
            {record.draft.reviewItems.length === 1 ? "" : "s"} need review
          </p>
        ) : (
          <p className="italic text-muted">not generated yet</p>
        )}
      </div>
    </aside>
  );
}
