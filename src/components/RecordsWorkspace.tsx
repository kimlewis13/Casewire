"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";
import { SAMPLE_DOCUMENTS } from "@/lib/sampleDocuments";
import { formatDateTime } from "@/lib/format";

export function RecordsWorkspace({ record }: { record: CaseRecord }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [current, setCurrent] = useState(record);
  const [prevRecord, setPrevRecord] = useState(record);
  const router = useRouter();

  if (record !== prevRecord) {
    setPrevRecord(record);
    setCurrent(record);
  }
  const locked = current.mail.status !== "not_sent";

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
      setPasted("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  const { chronology, sources } = current.extraction;
  const providers = new Set(chronology.map((e) => e.provider)).size;
  const addedSourceIds = new Set(
    sources.map((s) => SAMPLE_DOCUMENTS.find((d) => d.name === s.name)?.id).filter(Boolean)
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
          Records on file ({sources.length})
        </p>
        {sources.length === 0 ? (
          <p className="text-sm italic text-muted">No records on file yet.</p>
        ) : (
          <>
            <ul className="mb-3 flex flex-col gap-1.5 text-sm">
              {sources.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-xs text-muted">added {formatDateTime(s.addedAt)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted">
              {chronology.length} combined entries · {providers} provider{providers === 1 ? "" : "s"}
            </p>
          </>
        )}
      </div>

      {locked ? (
        <p className="rounded-lg border border-dashed border-border bg-surface/60 p-4 text-sm text-muted">
          Records are locked — this case&rsquo;s letter has already gone out.
        </p>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-5">
          <h3 className="mb-1 font-display text-base font-semibold">Add a medical record</h3>
          <p className="mb-4 text-sm text-muted">
            Real cases often mean records from several providers who never talk to each other —
            add each one as it comes in. Sample records to try, or paste one in below.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {SAMPLE_DOCUMENTS.map((doc) => {
              const added = addedSourceIds.has(doc.id);
              return (
                <button
                  key={doc.id}
                  onClick={() => runExtraction({ documentId: doc.id })}
                  disabled={pending || added}
                  className="rounded-md border border-border bg-background p-4 text-left text-sm transition hover:border-accent disabled:opacity-50"
                >
                  <p className="font-semibold">
                    {doc.name} {added && <span className="font-normal text-muted">— added</span>}
                  </p>
                  <p className="mt-1 text-xs text-muted">{doc.description}</p>
                </button>
              );
            })}
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-accent">
              Or paste a record in as text
            </summary>
            <textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={8}
              placeholder={"Date: 2024-01-05\nProvider: ...\nType: visit\nNotes: ...\n---\nDate: ..."}
              className="mt-3 w-full rounded-md border border-border bg-background p-3 font-mono text-xs outline-none focus:border-accent"
            />
            <button
              onClick={() => runExtraction({ text: pasted })}
              disabled={pending || !pasted.trim()}
              className="mt-2 rounded-md bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-60"
            >
              Add this record
            </button>
          </details>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </div>
      )}

      {current.extraction.completed && (
        <details className="rounded-lg border border-border bg-surface p-5">
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
    </div>
  );
}
