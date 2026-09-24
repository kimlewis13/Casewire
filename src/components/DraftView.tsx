"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";

export function DraftView({ record }: { record: CaseRecord }) {
  const [current, setCurrent] = useState(record);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const locked = current.mail.status !== "not_sent";

  const hasNewerRecords =
    !current.draft.generatedAt ||
    (!!current.extraction.ranAt &&
      new Date(current.extraction.ranAt).getTime() >
        new Date(current.draft.generatedAt).getTime());
  const regenerateDisabled = !!current.draft.letter && !hasNewerRecords;

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

  if (!current.extraction.completed) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted">
        Add the medical records first — the letter pulls its chronology and
        damages narrative straight from there.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {current.draft.letter
            ? `Drafted ${new Date(current.draft.generatedAt!).toLocaleString()}`
            : "Not drafted yet."}
        </p>
        {!locked && (
          <button
            onClick={generate}
            disabled={generating || regenerateDisabled}
            title={
              regenerateDisabled
                ? "No new medical records since this letter was drafted — nothing to regenerate."
                : undefined
            }
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold transition hover:border-accent hover:text-accent disabled:opacity-60 disabled:hover:border-border disabled:hover:text-foreground"
          >
            {generating
              ? "Drafting…"
              : current.draft.letter
              ? "Regenerate from current record"
              : "Generate demand letter"}
          </button>
        )}
      </div>

      {current.draft.letter && (
        <>
          {current.draft.reviewItems.length > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
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

          <pre className="whitespace-pre-wrap rounded-lg border border-border bg-surface p-6 font-mono text-sm leading-relaxed">
            {current.draft.letter}
          </pre>
        </>
      )}
    </div>
  );
}
