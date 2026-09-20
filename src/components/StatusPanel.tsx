"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";
import { STAGE_DOT_CLASS, STAGE_LABEL, STAGE_ORDER, formatDateTime, formatHoursInStage } from "@/lib/format";
import type { FollowUpCheckResult } from "@/lib/followup";

export function StatusPanel({
  record,
  hours,
  overdue,
}: {
  record: CaseRecord;
  hours: number;
  overdue: boolean;
}) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<FollowUpCheckResult | null>(null);
  const router = useRouter();
  const stageIndex = STAGE_ORDER.indexOf(record.stage);

  async function checkNow() {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch(`/api/cases/${record.id}/check`, { method: "POST" });
      const data = await res.json();
      setResult(data);
      router.refresh();
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">
          Pipeline position
        </p>
        <div className="flex items-center">
          {STAGE_ORDER.map((stage, i) => (
            <div key={stage} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                    i <= stageIndex ? STAGE_DOT_CLASS[stage] : "bg-border text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-center text-xs text-muted">{STAGE_LABEL[stage]}</span>
              </div>
              {i < STAGE_ORDER.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${i < stageIndex ? "bg-foreground/40" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`rounded-2xl border p-5 ${
          overdue ? "border-danger/40 bg-danger/5" : "border-border bg-surface"
        }`}
      >
        <p className="text-sm">
          In <strong>{STAGE_LABEL[record.stage]}</strong> for{" "}
          <strong>{formatHoursInStage(hours)}</strong> · follow-up window is{" "}
          {record.followUpWindowHours}h
        </p>
        {overdue ? (
          <p className="mt-1 text-sm font-semibold text-danger">
            Past its follow-up window — this case should be alerted.
          </p>
        ) : (
          <p className="mt-1 text-sm text-success">Within its follow-up window.</p>
        )}

        <button
          onClick={checkNow}
          disabled={checking}
          className="mt-4 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold transition hover:border-accent-2 hover:text-accent-2 disabled:opacity-60"
        >
          {checking ? "Checking…" : "Run follow-up check for this case"}
        </button>

        {result && (
          <div className="mt-3 rounded-xl border border-border bg-background p-3 text-xs">
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
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
          Follow-up alert history
        </p>
        {record.followUpLog.length === 0 ? (
          <p className="text-sm text-muted">No alerts triggered yet.</p>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {record.followUpLog.map((log) => (
              <li key={log.id} className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted">
                  {formatDateTime(log.triggeredAt)} · while in {STAGE_LABEL[log.stage]}
                </p>
                <p>email: {log.emailStatus} — {log.emailDetail}</p>
                <p>sms: {log.smsStatus} — {log.smsDetail}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
