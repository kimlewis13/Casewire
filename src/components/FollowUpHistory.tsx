import type { CaseRecord } from "@/lib/types";
import { formatDateTime, STAGE_LABEL } from "@/lib/format";

export function FollowUpHistory({ record }: { record: CaseRecord }) {
  if (record.followUpLog.length === 0) return null;

  return (
    <details className="text-sm">
      <summary className="cursor-pointer select-none font-semibold text-muted hover:text-foreground">
        Follow-up history ({record.followUpLog.length})
      </summary>
      <ul className="mt-3 flex flex-col gap-2">
        {record.followUpLog.map((log) => (
          <li key={log.id} className="rounded-md border border-border bg-background p-3 text-xs">
            <p className="text-muted">
              {formatDateTime(log.triggeredAt)} · while in {STAGE_LABEL[log.stage]}
            </p>
            <p>email: {log.emailStatus} — {log.emailDetail}</p>
            <p>sms: {log.smsStatus} — {log.smsDetail}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
