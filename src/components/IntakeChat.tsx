"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord, IntakeTurn } from "@/lib/types";

export function IntakeChat({ record }: { record: CaseRecord }) {
  const [transcript, setTranscript] = useState<IntakeTurn[]>(record.intake.transcript);
  const [completed, setCompleted] = useState(record.intake.completed);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current || transcript.length > 0) return;
    started.current = true;
    fetch(`/api/cases/${record.id}/intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "__start__" }),
    })
      .then((res) => res.json())
      .then((data) => setTranscript(data.case.intake.transcript));
  }, [record.id, transcript.length]);

  async function send() {
    const message = input.trim();
    if (!message || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/cases/${record.id}/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setTranscript(data.case.intake.transcript);
      setCompleted(data.case.intake.completed);
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function continueToRecords() {
    setAdvancing(true);
    try {
      const res = await fetch(`/api/cases/${record.id}/advance`, { method: "POST" });
      if (res.ok) {
        router.push(`/case/${record.id}/extraction`);
        router.refresh();
      }
    } finally {
      setAdvancing(false);
    }
  }

  const currentQuestion = transcript[transcript.length - 1];

  if (completed) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="mb-3 text-sm text-muted">
          Client details captured — the facts are in the panel to the right.
        </p>
        <button
          onClick={continueToRecords}
          disabled={advancing}
          className="rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:brightness-110 disabled:opacity-60"
        >
          {advancing ? "Moving on…" : "Continue to medical records →"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      {transcript.length === 0 ? (
        <p className="text-sm text-muted">Starting the intake conversation…</p>
      ) : (
        <>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            {currentQuestion?.isFollowUp ? "Following up — that was a bit vague" : "Ask the client"}
          </p>
          <p className="mb-4 text-base">{currentQuestion?.text}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type the client's answer…"
              disabled={sending}
              className="flex-1 rounded-md border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-md bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}
