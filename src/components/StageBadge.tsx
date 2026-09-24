import type { CaseRecord } from "@/lib/types";
import { STAGE_BADGE_CLASS, stageDisplayLabel } from "@/lib/format";

export function StageBadge({ record }: { record: CaseRecord }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STAGE_BADGE_CLASS[record.stage]}`}
    >
      {stageDisplayLabel(record)}
    </span>
  );
}
