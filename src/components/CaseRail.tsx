"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";
import { INTAKE_FIELDS } from "@/lib/intakeScript";
import { MailPanel } from "@/components/MailPanel";
import { ChatTranscriptModal } from "@/components/ChatTranscriptModal";

export function CaseRail({ record: initial }: { record: CaseRecord }) {
  const [record, setRecord] = useState(initial);
  const [showChat, setShowChat] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingFlagId, setPendingFlagId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const router = useRouter();

  async function setFlagResolved(flagId: string, resolved: boolean, note?: string) {
    setBusyId(flagId);
    setNoteError(null);
    try {
      const res = await fetch(`/api/cases/${record.id}/extraction/flags/${flagId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNoteError(data.error ?? "Couldn't save");
        return;
      }
      setRecord(data.case);
      setPendingFlagId(null);
      setNoteText("");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const unresolvedFlags = record.extraction.flags.filter((f) => !f.resolved);
  const showChecklist =
    record.extraction.completed &&
    record.extraction.flags.length > 0 &&
    record.mail.status === "not_sent";

  let nextStepLabel: string | null = null;
  if (!record.intake.completed) {
    nextStepLabel = "Continue client intake";
  } else if (!record.extraction.completed) {
    nextStepLabel = "Add medical records";
  } else if (!record.draft.letter) {
    nextStepLabel = "Generate demand letter";
  }

  return (
    <aside className="flex flex-col gap-4">
      {nextStepLabel && (
        <Link
          href={`/case/${record.id}`}
          className="rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground transition hover:brightness-110"
        >
          {nextStepLabel} →
        </Link>
      )}

      {showChecklist && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-warning">
            Needs attorney review
          </p>
          <p className="mb-3 text-xs text-muted">
            {unresolvedFlags.length} of {record.extraction.flags.length} still open — all must
            be cleared before this can be sent.
          </p>
          <ul className="flex flex-col gap-2">
            {record.extraction.flags.map((flag) => (
              <li key={flag.id} className="text-sm">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={flag.resolved}
                    disabled={busyId === flag.id}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPendingFlagId(flag.id);
                        setNoteText("");
                        setNoteError(null);
                      } else {
                        setFlagResolved(flag.id, false);
                      }
                    }}
                    className="mt-1"
                  />
                  <span className={flag.resolved ? "text-muted line-through" : ""}>
                    {flag.message}
                  </span>
                </label>

                {pendingFlagId === flag.id && (
                  <div className="mt-2 ml-6 flex flex-col gap-2 rounded-md border border-border bg-background p-3">
                    <label className="text-xs font-semibold text-muted">
                      What did you confirm?
                    </label>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={2}
                      placeholder="e.g. Called PT office — gap was an insurance authorization delay, not a lapse in care."
                      className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
                    />
                    {noteError && <p className="text-xs text-danger">{noteError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFlagResolved(flag.id, true, noteText)}
                        disabled={busyId === flag.id || !noteText.trim()}
                        className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-60"
                      >
                        {busyId === flag.id ? "Saving…" : "Confirm resolved"}
                      </button>
                      <button
                        onClick={() => setPendingFlagId(null)}
                        className="rounded-md px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {record.draft.letter && (
        <MailPanel
          record={record}
          onChange={setRecord}
          disabledReason={
            unresolvedFlags.length > 0
              ? `${unresolvedFlags.length} review item${unresolvedFlags.length === 1 ? "" : "s"} still need${unresolvedFlags.length === 1 ? "s" : ""} to be cleared above before this can go out.`
              : null
          }
        />
      )}

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
          Case facts
        </p>
        <div className="flex flex-col gap-2 text-sm">
          {INTAKE_FIELDS.map((field) => {
            const value = record.intake.values[field.key];
            return (
              <div key={field.key} className="border-t border-border pt-2 first:border-0 first:pt-0">
                <p className="text-xs font-semibold text-muted">{field.label}</p>
                <p className={value ? "" : "italic text-muted"}>{value ?? "Not captured yet"}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-3 border-t border-border pt-2 text-sm">
          <p className="text-xs font-semibold text-muted">Source</p>
          {record.source === "chatbot" ? (
            record.intake.transcript.length > 0 ? (
              <button
                onClick={() => setShowChat(true)}
                className="text-accent underline underline-offset-2 hover:text-accent-2"
              >
                Website chat — view transcript
              </button>
            ) : (
              <p className="italic text-muted">Website chat</p>
            )
          ) : (
            <p>Entered directly by {record.owner}</p>
          )}
        </div>
      </div>

      {showChat && (
        <ChatTranscriptModal
          transcript={record.intake.transcript}
          onClose={() => setShowChat(false)}
        />
      )}
    </aside>
  );
}
