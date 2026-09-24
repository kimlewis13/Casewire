"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";
import { INTAKE_FIELDS } from "@/lib/intakeScript";

export function DirectEntryForm({ record }: { record: CaseRecord }) {
  const [values, setValues] = useState<Record<string, string>>(record.intake.values);
  const [completed, setCompleted] = useState(record.intake.completed);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${record.id}/intake/direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save");
      setCompleted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
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

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="mb-4 text-xs text-muted">
        Entered directly — fill in what the client told you on the call.
      </p>
      <div className="grid gap-4">
        {INTAKE_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1 text-sm">
            {field.label}
            <textarea
              value={values[field.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              disabled={completed}
              rows={field.key === "incidentDate" ? 1 : 2}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-70"
            />
          </label>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-4">
        {completed ? (
          <button
            onClick={continueToRecords}
            disabled={advancing}
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {advancing ? "Moving on…" : "Continue to medical records →"}
          </button>
        ) : (
          <button
            onClick={save}
            disabled={saving || INTAKE_FIELDS.some((f) => !values[f.key]?.trim())}
            className="rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save client details"}
          </button>
        )}
      </div>
    </div>
  );
}
