"use client";

import { useEffect, useRef, useState } from "react";
import type { CaseRecord } from "@/lib/types";
import { IntakeChat } from "@/components/IntakeChat";

async function createWidgetCase(): Promise<CaseRecord> {
  const res = await fetch("/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientName: "New chatbot visitor", source: "chatbot" }),
  });
  const data = await res.json();
  return data.case;
}

export default function ChatbotLandingPage() {
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    createWidgetCase().then(setRecord);
  }, []);

  async function startNewConversation() {
    setRecord(null);
    const fresh = await createWidgetCase();
    setRecord(fresh);
  }

  function onCompleted() {
    if (!record) return;
    fetch(`/api/cases/${record.id}/complete-public-intake`, { method: "POST" }).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6 flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">
          Chatbot prototype
        </span>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Client intake, from the client&rsquo;s side
        </h1>
        <p className="text-sm text-muted">
          This is a walkthrough, not a live feature — in a real deployment this
          conversation would be embedded directly on the firm&rsquo;s own
          website, so a visitor could start it the moment they land on the
          page after an accident. It isn&rsquo;t wired up as an embeddable
          widget here; it&rsquo;s presented on its own page purely to showcase
          the conversation itself. Answer as if you were the client — the
          conversation you finish here creates a real case, which you can then
          see land on the internal dashboard.
        </p>
      </div>

      {record ? (
        <>
          <div className="mb-3 flex justify-end">
            <button
              onClick={startNewConversation}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold transition hover:border-accent hover:text-accent"
            >
              Start a new conversation
            </button>
          </div>
          <IntakeChat key={record.id} record={record} variant="public" onCompleted={onCompleted} />
        </>
      ) : (
        <p className="text-sm text-muted">Starting the conversation…</p>
      )}
    </div>
  );
}
