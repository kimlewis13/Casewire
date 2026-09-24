"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord, IntakeTurn } from "@/lib/types";
import { CaseRecordSummary } from "@/components/CaseRecordSummary";

export function IntakeChat({ record }: { record: CaseRecord }) {
  const [transcript, setTranscript] = useState<IntakeTurn[]>(record.intake.transcript);
  const [values, setValues] = useState(record.intake.values);
  const [completed, setCompleted] = useState(record.intake.completed);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
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
      setValues(data.case.intake.values);
      setCompleted(data.case.intake.completed);
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
  const recordWithLiveValues: CaseRecord = {
    ...record,
    intake: { ...record.intake, values },
  };

  return (
    <div className="flex flex-col gap-6">
      <CaseRecordSummary record={recordWithLiveValues} variant="primary" />

      {completed ? (
        <button
          onClick={continueToRecords}
          disabled={advancing}
          className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-105 disabled:opacity-60"
        >
          {advancing ? "Moving on…" : "Continue to medical records →"}
        </button>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-5">
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
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent-2 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <details
        open={chatOpen}
        onToggle={(e) => setChatOpen((e.target as HTMLDetailsElement).open)}
        className="rounded-2xl border border-border bg-surface p-5"
      >
        <summary className="cursor-pointer select-none text-sm font-semibold text-muted hover:text-foreground">
          View chat details
        </summary>
        <div className="mt-4 flex max-h-[24rem] flex-col gap-3 overflow-y-auto scrollbar-thin">
          {transcript.map((turn) => (
            <div
              key={turn.id}
              className={`flex ${turn.role === "client" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  turn.role === "client"
                    ? "bg-accent-2 text-accent-2-foreground"
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
      </details>
    </div>
  );
}
