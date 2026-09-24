"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";
import type { FollowUpCheckResult } from "@/lib/followup";
import { formatDateTime, STAGE_LABEL } from "@/lib/format";

export function FollowUpHistory({ record }: { record: CaseRecord }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<FollowUpCheckResult | null>(null);
  const router = useRouter();

  async function checkNow() {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch(`/api/cases/${record.id}/check`, { method: "POST" });
      setResult(await res.json());
      router.refresh();
    } finally {
      setChecking(false);
    }
  }

  return (
    <details className="text-sm">
      <summary className="cursor-pointer select-none font-semibold text-muted hover:text-foreground">
        Follow-up history ({record.followUpLog.length})
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <button
          onClick={checkNow}
          disabled={checking}
          className="self-start rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold transition hover:border-accent-2 hover:text-accent-2 disabled:opacity-60"
        >
          {checking ? "Checking…" : "Run follow-up check for this case"}
        </button>

        {result && (
          <div className="rounded-xl border border-border bg-background p-3 text-xs">
            {!result.overdue && <p>Not overdue — nothing to send.</p>}
            {result.overdue && result.alreadyAlerted && !result.log && (
              <p>Already alerted for this stage — no duplicate sent.</p>
            )}
            {result.log && (
              <>
                <p>email: {result.log.emailStatus} — {result.log.emailDetail}</p>
                <p>sms: {result.log.smsStatus} — {result.log.smsDetail}</p>
              </>
            )}
          </div>
        )}

        {record.followUpLog.length === 0 ? (
          <p className="text-xs text-muted">No alerts triggered yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {record.followUpLog.map((log) => (
              <li key={log.id} className="rounded-xl border border-border bg-background p-3 text-xs">
                <p className="text-muted">
                  {formatDateTime(log.triggeredAt)} · while in {STAGE_LABEL[log.stage]}
                </p>
                <p>email: {log.emailStatus} — {log.emailDetail}</p>
                <p>sms: {log.smsStatus} — {log.smsDetail}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
