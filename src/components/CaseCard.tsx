import Link from "next/link";
import type { CaseRecord } from "@/lib/types";
import { StageBadge } from "@/components/StageBadge";
import { formatHoursInStage } from "@/lib/format";
import { hoursInStage, isOverdue } from "@/lib/followup";

const STAGE_TO_TAB: Record<CaseRecord["stage"], string> = {
  intake: "intake",
  extraction: "extraction",
  draft: "draft",
  tracking: "status",
};

export function CaseCard({ record }: { record: CaseRecord }) {
  const overdue = isOverdue(record);
  const hours = hoursInStage(record);

  return (
    <Link
      href={`/case/${record.id}/${STAGE_TO_TAB[record.stage]}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5"
    >
      {overdue && (
        <span className="absolute right-0 top-0 rounded-bl-xl bg-danger px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Needs follow-up
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">
            {record.clientName}
          </h3>
          <p className="text-xs text-muted">Owner: {record.owner}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StageBadge stage={record.stage} />
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
            overdue
              ? "border-danger/30 bg-danger/10 text-danger"
              : "border-border bg-background text-muted"
          }`}
        >
          {formatHoursInStage(hours)} in stage
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-muted">
        <span>Follow-up window: {record.followUpWindowHours}h</span>
        <span className="font-semibold text-accent-2 group-hover:underline">
          Open case →
        </span>
      </div>
    </Link>
  );
}
