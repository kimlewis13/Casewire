import type { CaseRecord } from "@/lib/types";
import {
  STAGE_DOT_CLASS,
  STAGE_LABEL,
  STAGE_ORDER,
  formatHoursInStage,
  stageDisplayLabel,
} from "@/lib/format";
import { hoursInStage, isOverdue } from "@/lib/followup";
import { FollowUpHistory } from "@/components/FollowUpHistory";

export function CaseHeader({ record }: { record: CaseRecord }) {
  const overdue = isOverdue(record);
  const stageIndex = STAGE_ORDER.indexOf(record.stage);

  return (
    <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {record.clientName}
          </h1>
          <p className="mt-1 text-sm text-muted">Owner {record.owner}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full border border-border bg-background px-3 py-1 text-sm font-semibold">
            {stageDisplayLabel(record)}
          </span>
          <span className="text-xs text-muted">
            {formatHoursInStage(hoursInStage(record))} in this stage
          </span>
        </div>
      </div>

      {overdue && (
        <p className="rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-semibold text-danger">
          Past its {record.followUpWindowHours}h follow-up window — this case needs attention.
        </p>
      )}

      <div className="flex items-center">
        {STAGE_ORDER.map((stage, i) => (
          <div key={stage} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                  i <= stageIndex ? STAGE_DOT_CLASS[stage] : "bg-border text-muted"
                }`}
              >
                {i + 1}
              </span>
              <span className="whitespace-nowrap text-center text-[11px] text-muted">
                {STAGE_LABEL[stage]}
              </span>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <div
                className={`mx-2 h-0.5 flex-1 ${i < stageIndex ? "bg-foreground/40" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      <FollowUpHistory record={record} />
    </div>
  );
}
