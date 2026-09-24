import Link from "next/link";
import type { CaseRecord } from "@/lib/types";
import { StageBadge } from "@/components/StageBadge";
import { formatHoursInStage } from "@/lib/format";
import { hoursInStage, isOverdue } from "@/lib/followup";

const STAGE_TO_TAB: Record<CaseRecord["stage"], string> = {
  intake: "",
  extraction: "extraction",
  draft: "draft",
  tracking: "draft",
};

function caseHref(record: CaseRecord): string {
  const tab = STAGE_TO_TAB[record.stage];
  return tab ? `/case/${record.id}/${tab}` : `/case/${record.id}`;
}

export function CaseCard({ record }: { record: CaseRecord }) {
  const overdue = isOverdue(record);
  const hours = hoursInStage(record);

  return (
    <Link
      href={caseHref(record)}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-lg border border-border bg-surface p-5 transition hover:shadow-sm"
    >
      {overdue && (
        <span className="absolute right-0 top-0 rounded-bl-md bg-danger px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
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
        <StageBadge record={record} />
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${
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
        <span className="font-semibold text-accent group-hover:underline">
          Open case →
        </span>
      </div>
    </Link>
  );
}
