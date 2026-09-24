"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";
import { SAMPLE_DOCUMENTS } from "@/lib/sampleDocuments";
import { SEVERITY_BADGE_CLASS } from "@/lib/format";

const FLAG_LABEL: Record<string, string> = {
  gap: "Treatment gap",
  inconsistency: "Inconsistency",
  missing: "Unresolved item",
};

export function RecordsWorkspace({ record }: { record: CaseRecord }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [current, setCurrent] = useState(record);
  const [advancing, setAdvancing] = useState(false);
  const router = useRouter();

  async function runExtraction(body: { documentId?: string; text?: string }) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${record.id}/extraction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't read that record");
      setCurrent(data.case);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  async function continueToDraft() {
    setAdvancing(true);
    try {
      const res = await fetch(`/api/cases/${record.id}/advance`, { method: "POST" });
      if (res.ok) {
        router.push(`/case/${record.id}/draft`);
        router.refresh();
      }
    } finally {
      setAdvancing(false);
    }
  }

  const { chronology, flags } = current.extraction;
  const first = chronology[0];
  const last = chronology[chronology.length - 1];
  const providers = new Set(chronology.map((e) => e.provider)).size;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
          On file
        </p>
        {current.extraction.completed ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <p>
              <span className="font-semibold">{current.extraction.sourceDocumentName}</span>
            </p>
            <p className="text-muted">
              {chronology.length} entries · {providers} provider{providers === 1 ? "" : "s"}
            </p>
            {first && last && (
              <p className="text-muted">
                {first.date} – {last.date}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm italic text-muted">No records on file yet.</p>
        )}
      </div>

      {current.extraction.completed && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="mb-3 font-display text-base font-semibold">
            Needs review before drafting
          </h3>
          {flags.length === 0 ? (
            <p className="text-sm text-muted">
              Nothing flagged — this file looks complete.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {flags.map((flag) => (
                <li key={flag.id} className="rounded-xl border border-border bg-background p-3 text-sm">
                  <span
                    className={`mb-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${SEVERITY_BADGE_CLASS[flag.severity]}`}
                  >
                    {FLAG_LABEL[flag.type]} · {flag.severity}
                  </span>
                  <p className="mt-1">{flag.message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="mb-1 font-display text-base font-semibold">Add a medical record</h3>
        <p className="mb-4 text-sm text-muted">
          Two sample records to try, or paste one in below.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => runExtraction({ documentId: doc.id })}
              disabled={pending}
              className="rounded-xl border border-border bg-background p-4 text-left text-sm transition hover:border-accent-2 disabled:opacity-60"
            >
              <p className="font-semibold">{doc.name}</p>
              <p className="mt-1 text-xs text-muted">{doc.description}</p>
            </button>
          ))}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-accent-2">
            Or paste a record in as text
          </summary>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={8}
            placeholder={"Date: 2024-01-05\nProvider: ...\nType: visit\nNotes: ...\n---\nDate: ..."}
            className="mt-3 w-full rounded-xl border border-border bg-background p-3 font-mono text-xs outline-none focus:border-accent-2"
          />
          <button
            onClick={() => runExtraction({ text: pasted })}
            disabled={pending || !pasted.trim()}
            className="mt-2 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-60"
          >
            Add this record
          </button>
        </details>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>

      {current.extraction.completed && (
        <details className="rounded-2xl border border-border bg-surface p-5">
          <summary className="cursor-pointer select-none text-sm font-semibold text-muted hover:text-foreground">
            View full chronology
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Provider</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2">Summary</th>
                </tr>
              </thead>
              <tbody>
                {chronology.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/60 align-top">
                    <td className="whitespace-nowrap py-2 pr-3 font-mono text-xs">{entry.date}</td>
                    <td className="py-2 pr-3">{entry.provider}</td>
                    <td className="py-2 pr-3 capitalize text-muted">{entry.type}</td>
                    <td className="py-2">{entry.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {current.extraction.completed && (
        <button
          onClick={continueToDraft}
          disabled={advancing}
          className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-105 disabled:opacity-60"
        >
          {advancing ? "Moving on…" : "Continue to demand letter →"}
        </button>
      )}
    </div>
  );
}
