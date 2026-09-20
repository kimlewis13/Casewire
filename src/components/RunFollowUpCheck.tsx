"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FollowUpCheckResult } from "@/lib/followup";

export function RunFollowUpCheck() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<FollowUpCheckResult[] | null>(null);
  const router = useRouter();

  async function run() {
    setRunning(true);
    setResults(null);
    try {
      const res = await fetch("/api/tracker/check", { method: "POST" });
      const data = await res.json();
      setResults(data.results ?? []);
      router.refresh();
    } finally {
      setRunning(false);
    }
  }

  const triggered = results?.filter((r) => r.log) ?? [];

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={run}
        disabled={running}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold transition hover:border-accent-2 hover:text-accent-2 disabled:opacity-60"
      >
        {running ? "Checking cases…" : "Run follow-up check"}
      </button>
      {results && (
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-3 text-xs">
          {triggered.length === 0 ? (
            <p className="text-muted">No cases are past their follow-up window right now.</p>
          ) : (
            <ul className="space-y-2">
              {triggered.map((r) => (
                <li key={r.caseId}>
                  <p className="font-semibold">{r.clientName}</p>
                  <p className="text-muted">
                    email: {r.log?.emailStatus} — {r.log?.emailDetail}
                  </p>
                  <p className="text-muted">
                    sms: {r.log?.smsStatus} — {r.log?.smsDetail}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
