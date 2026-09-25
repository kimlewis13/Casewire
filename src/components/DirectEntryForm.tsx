"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseRecord } from "@/lib/types";

const NARRATIVE_FIELDS = [
  { key: "incidentNarrative", label: "What happened" },
  { key: "injuryDescription", label: "Injuries" },
  { key: "liabilityDetail", label: "Liability detail" },
  { key: "treatmentStatus", label: "Current treatment status" },
  { key: "priorConditionSameArea", label: "Prior injury to the same area, if any" },
  { key: "insuranceDetail", label: "Insurance and coverage" },
  { key: "claimFiled", label: "Claim already filed with an insurer?" },
] as const;

export function DirectEntryForm({ record }: { record: CaseRecord }) {
  const [incidentDate, setIncidentDate] = useState(record.intake.values.incidentDate ?? "");
  const [narrative, setNarrative] = useState<Record<string, string>>(
    Object.fromEntries(NARRATIVE_FIELDS.map((f) => [f.key, record.intake.values[f.key] ?? ""]))
  );
  const [priorRep, setPriorRep] = useState<"yes" | "no" | "">("");
  const [priorRepDetail, setPriorRepDetail] = useState("");
  const [completed, setCompleted] = useState(record.intake.completed);
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const canSave =
    incidentDate.trim() &&
    NARRATIVE_FIELDS.every((f) => narrative[f.key]?.trim()) &&
    priorRep !== "" &&
    (priorRep === "no" || priorRepDetail.trim());

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const priorRepresentation =
        priorRep === "yes" ? `Yes — ${priorRepDetail.trim()}` : "No prior attorney contact.";
      const res = await fetch(`/api/cases/${record.id}/intake/direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: { incidentDate, ...narrative, priorRepresentation },
        }),
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
        <label className="flex flex-col gap-1 text-sm">
          Incident date
          <input
            type="date"
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
            disabled={completed}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-70"
          />
        </label>

        {NARRATIVE_FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1 text-sm">
            {field.label}
            <textarea
              value={narrative[field.key]}
              onChange={(e) => setNarrative((v) => ({ ...v, [field.key]: e.target.value }))}
              disabled={completed}
              rows={2}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-70"
            />
          </label>
        ))}

        <div className="flex flex-col gap-2 text-sm">
          <span>Prior representation</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="priorRep"
                checked={priorRep === "no"}
                disabled={completed}
                onChange={() => setPriorRep("no")}
              />
              No
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="priorRep"
                checked={priorRep === "yes"}
                disabled={completed}
                onChange={() => setPriorRep("yes")}
              />
              Yes
            </label>
          </div>
          {priorRep === "yes" && (
            <textarea
              value={priorRepDetail}
              onChange={(e) => setPriorRepDetail(e.target.value)}
              disabled={completed}
              rows={2}
              placeholder="What happened with that prior representation?"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-70"
            />
          )}
        </div>
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
            disabled={saving || !canSave}
            className="rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save client details"}
          </button>
        )}
      </div>
    </div>
  );
}
