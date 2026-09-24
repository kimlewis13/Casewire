"use client";

import { useState } from "react";

export function ResolveNotePanel({
  flagMessage,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  flagMessage: string;
  busy: boolean;
  error: string | null;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onCancel}>
      <div
        className="flex h-full w-full max-w-sm flex-col border-l border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold">Resolve review item</p>
          <button onClick={onCancel} className="text-sm text-muted hover:text-foreground">
            Close
          </button>
        </div>

        <div className="mb-4 rounded-md border border-border bg-background p-3 text-sm">
          {flagMessage}
        </div>

        <label className="mb-1 text-xs font-semibold text-muted">What did you confirm?</label>
        <textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          placeholder="e.g. Called PT office — gap was an insurance authorization delay, not a lapse in care."
          className="mb-3 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(note)}
            disabled={busy || !note.trim()}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
          >
            {busy ? "Saving…" : "Confirm resolved"}
          </button>
          <button
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
