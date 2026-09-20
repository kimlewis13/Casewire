import type { CaseStage } from "@/lib/types";
import { STAGE_BADGE_CLASS, STAGE_LABEL } from "@/lib/format";

export function StageBadge({ stage }: { stage: CaseStage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STAGE_BADGE_CLASS[stage]}`}
    >
      {STAGE_LABEL[stage]}
    </span>
  );
}
