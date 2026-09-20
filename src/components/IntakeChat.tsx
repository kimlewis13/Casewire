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
  const bottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript.length]);

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
    } finally {
      setSending(false);
    }
  }

  async function continueToExtraction() {
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

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface">
      <div className="flex max-h-[28rem] min-h-[20rem] flex-col gap-3 overflow-y-auto scrollbar-thin p-5">
        {transcript.length === 0 && (
          <p className="text-sm text-muted">Starting the intake conversation…</p>
        )}
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
                  Following up — that was a bit vague
                </p>
              )}
              {turn.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-4">
        {completed ? (
          <button
            onClick={continueToExtraction}
            disabled={advancing}
            className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-105 disabled:opacity-60"
          >
            {advancing ? "Moving on…" : "Continue to document extraction →"}
          </button>
        ) : (
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
              disabled={sending || transcript.length === 0}
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
        )}
      </div>
    </div>
  );
}
