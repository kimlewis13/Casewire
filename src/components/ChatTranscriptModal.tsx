"use client";

import type { IntakeTurn } from "@/lib/types";

export function ChatTranscriptModal({
  transcript,
  onClose,
}: {
  transcript: IntakeTurn[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Chat details</p>
          <button
            onClick={onClose}
            className="text-sm text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto scrollbar-thin p-4">
          {transcript.map((turn) => (
            <div
              key={turn.id}
              className={`flex ${turn.role === "client" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                  turn.role === "client"
                    ? "bg-accent text-accent-foreground"
                    : turn.isFollowUp
                    ? "border border-warning/40 bg-warning/10 text-foreground"
                    : "bg-background text-foreground"
                }`}
              >
                {turn.isFollowUp && (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-warning">
                    Follow-up
                  </p>
                )}
                {turn.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
