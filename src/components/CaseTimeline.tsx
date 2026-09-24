"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseNote } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

export function CaseTimeline({
  caseId,
  notes,
}: {
  caseId: string;
  notes: CaseNote[];
}) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function addNote() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        setText("");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="mb-1 font-display text-base font-semibold">Notes &amp; activity</h3>
      <p className="mb-4 text-sm text-muted">
        A running log for this case — general notes, plus every review item as it&rsquo;s resolved.
      </p>

      <div className="mb-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          placeholder="Add a note…"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={addNote}
          disabled={saving || !text.trim()}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
        >
          Add
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm italic text-muted">No activity logged yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-md border border-border bg-background p-3 text-sm">
              <p className="mb-1 text-xs text-muted">
                {formatDateTime(n.createdAt)} · {n.author}
              </p>
              {n.kind === "action" ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Action
                  </p>
                  <p className="mb-2">{n.actionLabel}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Resolution
                  </p>
                  <p>{n.text}</p>
                </>
              ) : (
                <p>{n.text}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
