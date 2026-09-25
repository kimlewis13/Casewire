"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";
import { INTAKE_FIELDS } from "@/lib/intakeScript";
import { MailPanel } from "@/components/MailPanel";
import { ChatTranscriptModal } from "@/components/ChatTranscriptModal";
import { ResolveNotePanel } from "@/components/ResolveNotePanel";
import { InsuranceCard } from "@/components/InsuranceCard";
import { useToast } from "@/components/Toast";

export function CaseRail({ record: initial }: { record: CaseRecord }) {
  const [record, setRecord] = useState(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  const [showChat, setShowChat] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resolvingFlagId, setResolvingFlagId] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setRecord(initial);
  }

  async function setFlagResolved(flagId: string, resolved: boolean, note?: string) {
    setBusyId(flagId);
    setResolveError(null);
    try {
      const res = await fetch(`/api/cases/${record.id}/extraction/flags/${flagId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResolveError(data.error ?? "Couldn't save");
        return;
      }
      setRecord(data.case);
      setResolvingFlagId(null);
      (data.mentions ?? []).forEach((m: { targetPerson: string }) =>
        showToast({ title: `Tagged ${m.targetPerson}`, description: "They'll see it in the notes feed." })
      );
      if ((data.mentions ?? []).length > 0) {
        window.dispatchEvent(new Event("casewire:mentions-updated"));
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function advanceStage() {
    setAdvancing(true);
    try {
      const res = await fetch(`/api/cases/${record.id}/advance`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setAdvancing(false);
    }
  }

  const unresolvedFlags = record.extraction.flags.filter((f) => !f.resolved);
  const showChecklist =
    record.extraction.completed &&
    record.extraction.flags.length > 0 &&
    record.mail.status === "not_sent";
  const resolvingFlag = record.extraction.flags.find((f) => f.id === resolvingFlagId);

  // What's actionable right now: a scroll-to link for "go do the next thing,"
  // or a real action button only when the action is an actual state change
  // (advancing the case out of records review) rather than navigation.
  let nextStep: { label: string; kind: "link" | "action" } | null = null;
  if (!record.intake.completed) {
    nextStep = { label: "Continue client intake", kind: "link" };
  } else if (!record.extraction.completed) {
    nextStep = { label: "Add medical records", kind: "link" };
  } else if (record.stage === "extraction") {
    nextStep = { label: "Continue to demand letter", kind: "action" };
  } else if (!record.draft.letter) {
    nextStep = { label: "Generate the demand letter", kind: "link" };
  }

  return (
    <aside className="flex flex-col gap-4">
      {nextStep &&
        (nextStep.kind === "action" ? (
          <button
            onClick={advanceStage}
            disabled={advancing}
            className="rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {advancing ? "Moving on…" : `${nextStep.label} →`}
          </button>
        ) : (
          <Link
            href={`#${!record.intake.completed ? "intake" : !record.extraction.completed ? "records" : "letter"}`}
            className="rounded-lg bg-accent px-4 py-3 text-center text-sm font-semibold text-accent-foreground transition hover:brightness-110"
          >
            {nextStep.label} ↓
          </Link>
        ))}

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
              <li key={flag.id}>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={flag.resolved}
                    disabled={busyId === flag.id}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setResolvingFlagId(flag.id);
                        setResolveError(null);
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

      <InsuranceCard
        caseId={record.id}
        insurance={record.insurance}
        onChange={(insurance) => setRecord((r) => ({ ...r, insurance }))}
      />

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
          Case facts
        </p>
        {record.intake.statuteOfLimitationsDeadline && (
          <div className="mb-3 rounded-md border border-border bg-background p-2.5 text-sm">
            <p className="text-xs font-semibold text-muted">Statute of limitations (est.)</p>
            <p>
              {new Date(record.intake.statuteOfLimitationsDeadline).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Demo estimate — 2-year assumption from the incident date, confirm the actual jurisdiction.
            </p>
          </div>
        )}
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

      {resolvingFlag && (
        <ResolveNotePanel
          flagMessage={resolvingFlag.message}
          busy={busyId === resolvingFlag.id}
          error={resolveError}
          onConfirm={(note) => setFlagResolved(resolvingFlag.id, true, note)}
          onCancel={() => setResolvingFlagId(null)}
        />
      )}
    </aside>
  );
}
