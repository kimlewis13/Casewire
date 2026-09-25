"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";
import { IntakeChat } from "@/components/IntakeChat";

export function ChatbotDemoView({ record }: { record: CaseRecord }) {
  const [resetting, setResetting] = useState(false);
  const router = useRouter();

  async function reset() {
    setResetting(true);
    try {
      const res = await fetch("/api/chatbot-demo/reset", { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Conversation started {new Date(record.stageEnteredAt).toLocaleTimeString()}
        </p>
        <button
          onClick={reset}
          disabled={resetting}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold transition hover:border-accent hover:text-accent disabled:opacity-60"
        >
          {resetting ? "Resetting…" : "Reset conversation"}
        </button>
      </div>
      <IntakeChat key={record.stageEnteredAt} record={record} />
    </div>
  );
}
