"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord, IntakeTurn } from "@/lib/types";

function Bubble({ turn }: { turn: IntakeTurn }) {
  const isClient = turn.role === "client";
  return (
    <div className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
          isClient
            ? "bg-accent text-accent-foreground"
            : "border border-border bg-background text-foreground"
        }`}
      >
        {turn.text}
      </div>
    </div>
  );
}

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
        router.refresh();
      }
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-2.5 border-b border-border bg-background px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
          L&amp;L
        </span>
        <div>
          <p className="text-sm font-semibold">Intake conversation</p>
          <p className="text-xs text-muted">What the client saw on the website chat</p>
        </div>
      </div>

      <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto scrollbar-thin p-4">
        {transcript.length === 0 ? (
          <p className="text-sm text-muted">Starting the conversation…</p>
        ) : (
          transcript.map((turn) => <Bubble key={turn.id} turn={turn} />)
        )}
        <div ref={bottomRef} />
      </div>

      {!completed && transcript.length > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2 border-t border-border p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message…"
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
      )}

      {completed && (
        <div className="border-t border-dashed border-border bg-background p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
            Internal — visible only to your team
          </p>
          <button
            onClick={continueToRecords}
            disabled={advancing}
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {advancing ? "Moving on…" : "Continue to medical records →"}
          </button>
        </div>
      )}
    </div>
  );
}
