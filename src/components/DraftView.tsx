"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";

export function DraftView({ record }: { record: CaseRecord }) {
  const [current, setCurrent] = useState(record);
  const [generating, setGenerating] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const router = useRouter();

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/cases/${record.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) setCurrent(data.case);
      router.refresh();
    } finally {
      setGenerating(false);
    }
  }

  async function continueToTracking() {
    setAdvancing(true);
    try {
      const res = await fetch(`/api/cases/${record.id}/advance`, { method: "POST" });
      if (res.ok) {
        router.push(`/case/${record.id}/status`);
        router.refresh();
      }
    } finally {
      setAdvancing(false);
    }
  }

  if (!current.extraction.completed) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted">
        Run document extraction first — the draft pulls its chronology and
        damages narrative straight from there.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {current.draft.letter
            ? `Generated ${new Date(current.draft.generatedAt!).toLocaleString()}`
            : "Not generated yet."}
        </p>
        <button
          onClick={generate}
          disabled={generating}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold transition hover:border-accent-2 hover:text-accent-2 disabled:opacity-60"
        >
          {generating
            ? "Drafting…"
            : current.draft.letter
            ? "Regenerate from current record"
            : "Generate demand draft"}
        </button>
      </div>

      {current.draft.letter && (
        <>
          {current.draft.reviewItems.length > 0 && (
            <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-warning">
                Needs attorney review before sending
              </p>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {current.draft.reviewItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <pre className="whitespace-pre-wrap rounded-2xl border border-border bg-surface p-6 font-mono text-sm leading-relaxed">
            {current.draft.letter}
          </pre>

          <button
            onClick={continueToTracking}
            disabled={advancing}
            className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-105 disabled:opacity-60"
          >
            {advancing ? "Moving on…" : "Mark ready & move to tracking →"}
          </button>
        </>
      )}
    </div>
  );
}
